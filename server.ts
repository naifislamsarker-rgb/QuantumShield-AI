import 'dotenv/config';
import fs from 'node:fs';
import dns from 'node:dns/promises';
import net from 'node:net';
import path from 'node:path';
import tls from 'node:tls';
import express, { type NextFunction, type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';
import {
  clampBlueprintString,
  isBlockedIpAddress,
  parseScanTarget,
  sanitizeHeaderValue,
  type LiveTlsTelemetry,
} from './src/utils/securityScanner.ts';
import { validateAssessmentRequest } from './src/utils/quantumReadiness.ts';

function getCliArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const PORT = Number(getCliArg('--port') || process.env.PORT || 3000);
const HOST = getCliArg('--host') || process.env.HOST || '0.0.0.0';
const MODEL_ID = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

function getEmailTransportStatus(): 'resend' | 'smtp' | 'none' {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
}

async function dispatchEmail({
  to,
  subject,
  textBody,
  htmlBody,
}: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<{ emailStatus: 'sent' | 'not_configured' | 'failed'; emailDetail: string }> {
  const safeTo = sanitizeHeaderValue(to, 160);
  const safeSubject = sanitizeHeaderValue(subject, 180);
  const fromAddress = sanitizeHeaderValue(
    process.env.SMTP_FROM || process.env.SMTP_USER || 'QuantumShield AI <security@quantumshield.ai>',
    160
  );

  const mode = getEmailTransportStatus();
  if (mode === 'none') {
    return {
      emailStatus: 'not_configured',
      emailDetail:
        'Record saved. Configure SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY in Settings > Secrets to dispatch automated emails.',
    };
  }

  try {
    if (mode === 'resend') {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [safeTo],
          subject: safeSubject,
          text: textBody,
          html: htmlBody,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return {
          emailStatus: 'failed',
          emailDetail: `Email provider returned ${resp.status}: ${errText.slice(0, 180)}`,
        };
      }
      return {
        emailStatus: 'sent',
        emailDetail: `Confirmation email delivered to ${safeTo}.`,
      };
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: fromAddress,
      to: safeTo,
      subject: safeSubject,
      text: textBody,
      html: htmlBody,
    });
    return {
      emailStatus: 'sent',
      emailDetail: `Confirmation email delivered to ${safeTo} via SMTP.`,
    };
  } catch (err) {
    return {
      emailStatus: 'failed',
      emailDetail:
        err instanceof Error ? `Email dispatch failed: ${err.message}` : 'Email dispatch failed.',
    };
  }
}

async function probeTlsSocket(hostname: string, port: number): Promise<{
  tlsVersion: string;
  cipherName: string;
  keyExchangeBits: number | null;
  certSubject: string;
  certIssuer: string;
  certValidTo: string;
}> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: {
      tlsVersion: string;
      cipherName: string;
      keyExchangeBits: number | null;
      certSubject: string;
      certIssuer: string;
      certValidTo: string;
    }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      const tlsOptions: tls.ConnectionOptions = {
        host: hostname,
        port,
        rejectUnauthorized: false,
        timeout: 5500,
      };
      if (!net.isIP(hostname)) {
        tlsOptions.servername = hostname;
      }

      const socket = tls.connect(
        tlsOptions,
        () => {
          const tlsVersion = socket.getProtocol() || 'Unknown';
          const cipher = socket.getCipher();
          const eph = socket.getEphemeralKeyInfo();
          const peerCert = socket.getPeerCertificate(false);

          const certSubject =
            typeof peerCert?.subject?.CN === 'string'
              ? peerCert.subject.CN
              : hostname;
          const certIssuer =
            typeof peerCert?.issuer?.O === 'string'
              ? peerCert.issuer.O
              : typeof peerCert?.issuer?.CN === 'string'
              ? peerCert.issuer.CN
              : 'Unknown CA';
          const certValidTo = peerCert?.valid_to || 'Unknown';
          const keyExchangeBits =
            eph && 'size' in eph && typeof eph.size === 'number'
              ? eph.size
              : typeof peerCert?.bits === 'number'
              ? peerCert.bits
              : null;

          socket.end();
          finish({
            tlsVersion,
            cipherName: cipher?.name || 'Unknown',
            keyExchangeBits,
            certSubject,
            certIssuer,
            certValidTo,
          });
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        finish({
          tlsVersion: 'Timeout',
          cipherName: 'Unavailable',
          keyExchangeBits: null,
          certSubject: hostname,
          certIssuer: 'Timeout',
          certValidTo: 'Unknown',
        });
      });

      socket.on('error', () => {
        socket.destroy();
        finish({
          tlsVersion: 'Unencrypted / Refused',
          cipherName: 'None',
          keyExchangeBits: null,
          certSubject: hostname,
          certIssuer: 'None',
          certValidTo: 'None',
        });
      });
    } catch {
      finish({
        tlsVersion: 'Unencrypted / Refused',
        cipherName: 'None',
        keyExchangeBits: null,
        certSubject: hostname,
        certIssuer: 'None',
        certValidTo: 'None',
      });
    }
  });
}

async function probeSecurityHeaders(url: string): Promise<{
  httpStatus: number | null;
  headersPresent: string[];
  headersMissing: string[];
}> {
  const checkedHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'permissions-policy',
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    const resp = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'QuantumShield-Scanner/1.0' },
    });
    const headersPresent: string[] = [];
    const headersMissing: string[] = [];
    for (const h of checkedHeaders) {
      if (resp.headers.has(h)) {
        headersPresent.push(h);
      } else {
        headersMissing.push(h);
      }
    }
    return {
      httpStatus: resp.status,
      headersPresent,
      headersMissing,
    };
  } catch {
    return {
      httpStatus: null,
      headersPresent: [],
      headersMissing: checkedHeaders,
    };
  } finally {
    clearTimeout(timer);
  }
}

function handleAiError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'GEMINI_API_KEY_MISSING') {
    return res.status(503).json({
      error: 'Gemini AI key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
    });
  }
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({
      error: 'AI quota limit reached. Please retry shortly or configure a billing-enabled API key in Settings > Secrets.',
    });
  }
  return res.status(502).json({
    error: `AI analysis service unavailable: ${message.slice(0, 220)}`,
  });
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  // Health endpoint (booleans only, never exposes secrets)
  app.get('/api/health', (_req: Request, res: Response) => {
    const key = process.env.GEMINI_API_KEY;
    res.json({
      ok: true,
      aiReady: Boolean(key && key !== 'MY_GEMINI_API_KEY'),
      emailReady: getEmailTransportStatus() !== 'none',
      emailProvider: getEmailTransportStatus(),
    });
  });

  // Live Gemini AI Security Copilot
  app.post('/api/copilot', async (req: Request, res: Response) => {
    try {
      const rawQuery = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
      if (!rawQuery || rawQuery.length > 1000) {
        return res.status(400).json({ error: 'Query must be between 1 and 1000 characters.' });
      }

      const history = Array.isArray(req.body?.history)
        ? req.body.history
            .slice(-6)
            .map((m: { role?: string; text?: string }) =>
              `${m?.role === 'user' ? 'User' : 'Copilot'}: ${String(m?.text || '').slice(0, 350)}`
            )
            .join('\n')
        : '';

      const liveScansContext = Array.isArray(req.body?.liveScans)
        ? req.body.liveScans
            .slice(0, 6)
            .map(
              (s: { targetHost?: string; protocol?: string; readinessScore?: number; status?: string }) =>
                `- ${String(s?.targetHost || '')}: ${String(s?.protocol || '')}, Score ${Number(
                  s?.readinessScore ?? 0
                )}/100 (${String(s?.status || '')})`
            )
            .join('\n')
        : '';

      const ai = getAiClient();
      const prompt = [
        `User Query: ${rawQuery}`,
        history ? `Recent Conversation:\n${history}` : '',
        liveScansContext ? `Live Scanned Infrastructure Nodes:\n${liveScansContext}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: prompt,
          config: {
            systemInstruction:
              'You are QuantumShield AI Security Copilot, a senior post-quantum cryptography and critical infrastructure defense architect protecting Bangladesh healthcare, microfinance, education, industrial SCADA, and government portals. Provide concise, accurate, actionable guidance grounded in NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) and real TLS/HTTP hardening. Keep total text crisp and enterprise-ready.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: {
                  type: Type.STRING,
                  description: 'Direct 1-3 sentence executive summary answering the user query.',
                },
                readinessImpact: {
                  type: Type.STRING,
                  description: 'One concise sentence quantifying expected readiness score or risk impact.',
                },
                findings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      category: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ['High', 'Medium', 'Advisory'] },
                      detail: { type: Type.STRING },
                    },
                    required: ['id', 'category', 'severity', 'detail'],
                  },
                },
                recommendedAction: {
                  type: Type.STRING,
                  description: 'Concrete next action and technical hardening command or policy.',
                },
              },
              required: ['answer', 'readinessImpact', 'findings', 'recommendedAction'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({
        answer: clampBlueprintString(String(parsed.answer || 'Analysis complete.'), 2900),
        readinessImpact: clampBlueprintString(
          String(parsed.readinessImpact || 'Prioritized cryptographic upgrades identified.'),
          380
        ),
        findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 5) : [],
        recommendedAction: clampBlueprintString(
          String(parsed.recommendedAction || 'Apply hybrid ML-KEM TLS termination.'),
          950
        ),
      });
    } catch (error) {
      return handleAiError(res, error);
    }
  });

  // Live Infrastructure TLS + Security Header Scanner + Gemini AI Risk Scoring
  app.post('/api/scan', async (req: Request, res: Response) => {
    try {
      const targetUrl = typeof req.body?.targetUrl === 'string' ? req.body.targetUrl : '';
      const rawSector = typeof req.body?.sector === 'string' ? req.body.sector : 'government';
      const validSectors = ['healthcare', 'microfinance', 'education', 'government', 'industry'];
      const sector = validSectors.includes(rawSector) ? rawSector : 'government';
      const region = clampBlueprintString(
        typeof req.body?.region === 'string' && req.body.region.trim()
          ? req.body.region
          : 'Live External Probe',
        80
      );

      const parsed = parseScanTarget(targetUrl);
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
      }

      // Resolve DNS and block SSRF to internal/private IPs
      let resolvedRecords: { address: string }[];
      try {
        resolvedRecords = await dns.lookup(parsed.target.hostname, { all: true });
      } catch {
        return res.status(400).json({
          error: `Could not resolve DNS for ${parsed.target.hostname}. Verify the domain exists.`,
        });
      }

      if (!resolvedRecords.length || resolvedRecords.some((r) => isBlockedIpAddress(r.address))) {
        return res.status(403).json({
          error: 'Target resolves to a private, loopback, or reserved IP range and cannot be scanned.',
        });
      }

      // Perform real live TLS + HTTP security header inspection
      const [tlsInfo, headerInfo] = await Promise.all([
        parsed.target.protocol === 'https:'
          ? probeTlsSocket(parsed.target.hostname, parsed.target.port)
          : Promise.resolve({
              tlsVersion: 'None (HTTP)',
              cipherName: 'Unencrypted',
              keyExchangeBits: null,
              certSubject: parsed.target.hostname,
              certIssuer: 'None',
              certValidTo: 'None',
            }),
        probeSecurityHeaders(parsed.target.url),
      ]);

      const telemetry: LiveTlsTelemetry = {
        ...tlsInfo,
        ...headerInfo,
      };

      const ai = getAiClient();
      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: [
            `Evaluate the real live cryptographic and HTTP defense telemetry below for ${parsed.target.hostname} (Sector: ${sector}).`,
            `Telemetry JSON: ${JSON.stringify(telemetry)}`,
            'Compute an accurate post-quantum readinessScore (0-100) and riskIndex (0-100). If TLSv1.3 is active with strong headers, score higher (70-90) while noting hybrid ML-KEM readiness; if TLS 1.2, HTTP-only, or missing HSTS/CSP, score lower and list concrete Nginx/Cloudflare/OpenSSL PQC hardening steps.',
          ].join('\n\n'),
          config: {
            systemInstruction:
              'You are a Principal Cryptographic Security Auditor. Base your scoring and remediation strictly on the observed live TLS/header telemetry.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                readinessScore: { type: Type.INTEGER },
                riskIndex: { type: Type.INTEGER },
                status: {
                  type: Type.STRING,
                  enum: ['Quantum-Ready', 'Transitioning', 'Action Required'],
                },
                aiSummary: { type: Type.STRING },
                recommendedSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'readinessScore',
                'riskIndex',
                'status',
                'aiSummary',
                'recommendedSteps',
              ],
            },
          },
        })
      );

      const aiParsed = JSON.parse((response.text ?? '{}').trim());
      const readinessScore = Math.max(
        0,
        Math.min(100, Math.round(Number(aiParsed.readinessScore ?? 68)))
      );
      const riskIndex = Math.max(
        0,
        Math.min(100, Math.round(Number(aiParsed.riskIndex ?? 100 - readinessScore)))
      );
      const validStatuses = ['Quantum-Ready', 'Transitioning', 'Action Required'];
      const status = validStatuses.includes(aiParsed.status)
        ? aiParsed.status
        : readinessScore >= 82
        ? 'Quantum-Ready'
        : readinessScore >= 72
        ? 'Transitioning'
        : 'Action Required';

      const protocolSummary = clampBlueprintString(
        `${telemetry.tlsVersion} · ${telemetry.cipherName}`,
        140
      );

      const scanResult = {
        id: `live-${Date.now().toString(36)}`,
        targetHost: clampBlueprintString(parsed.target.hostname, 253),
        sector,
        region,
        protocol: protocolSummary,
        readinessScore,
        riskIndex,
        status,
        remediationApplied: false,
        aiSummary: clampBlueprintString(
          String(aiParsed.aiSummary || 'Live cryptographic inspection completed.'),
          1900
        ),
        recommendedSteps: Array.isArray(aiParsed.recommendedSteps)
          ? aiParsed.recommendedSteps
              .slice(0, 6)
              .map((s: unknown) => clampBlueprintString(String(s), 380))
          : ['Enable TLS 1.3 with hybrid X25519MLKEM768 key exchange and strict HSTS headers.'],
        telemetry,
      };

      return res.json(scanResult);
    } catch (error) {
      return handleAiError(res, error);
    }
  });

  // Real Assessment Submission & Automated Email Dispatch
  app.post('/api/contact/submit', async (req: Request, res: Response) => {
    const input = {
      fullName: typeof req.body?.fullName === 'string' ? req.body.fullName : '',
      organization: typeof req.body?.organization === 'string' ? req.body.organization : '',
      email: typeof req.body?.email === 'string' ? req.body.email : '',
      sector: typeof req.body?.sector === 'string' ? req.body.sector : '',
      mode: req.body?.mode === 'assessment' ? ('assessment' as const) : ('demo' as const),
      selectedPlan: typeof req.body?.selectedPlan === 'string' ? req.body.selectedPlan : 'Professional',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : '',
    };

    const validation = validateAssessmentRequest(input);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed.', errors: validation.errors });
    }

    const referenceId = `QS-BD-${Math.floor(100000 + Math.random() * 899999)}`;
    const safeName = sanitizeHeaderValue(input.fullName, 120);
    const safeOrg = sanitizeHeaderValue(input.organization, 160);
    const safeSector = sanitizeHeaderValue(input.sector, 80);
    const safePlan = sanitizeHeaderValue(input.selectedPlan, 60);

    const textBody = [
      `Hello ${safeName},`,
      '',
      `Your QuantumShield AI ${input.mode === 'demo' ? 'Executive Demo' : 'Quantum Readiness Assessment'} request has been registered.`,
      `Reference ID: ${referenceId}`,
      `Organization: ${safeOrg}`,
      `Sector: ${safeSector}`,
      `Deployment Track: ${safePlan}`,
      input.notes ? `Scope Notes: ${sanitizeHeaderValue(input.notes, 500)}` : '',
      '',
      'Our security architecture team will follow up with onboarding credentials.',
      '— QuantumShield AI Operations Hub',
    ]
      .filter(Boolean)
      .join('\n');

    const htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;background:#05070E;color:#E2E8F0;padding:24px;border-radius:12px;">
        <h2 style="color:#00FFFF;margin:0 0 12px;">QuantumShield AI — Request Confirmed</h2>
        <p>Hello <strong>${safeName.replace(/[<>&]/g, '')}</strong>,</p>
        <p>Your <strong>${input.mode === 'demo' ? 'Executive Demo' : 'Quantum Readiness Assessment'}</strong> is registered.</p>
        <ul>
          <li><strong>Reference ID:</strong> ${referenceId}</li>
          <li><strong>Organization:</strong> ${safeOrg.replace(/[<>&]/g, '')}</li>
          <li><strong>Sector:</strong> ${safeSector.replace(/[<>&]/g, '')}</li>
          <li><strong>Deployment Plan:</strong> ${safePlan.replace(/[<>&]/g, '')}</li>
        </ul>
        <p style="color:#94A3B8;font-size:12px;">QuantumShield AI · Protect Today. Defend Tomorrow. Secure the Quantum Future.</p>
      </div>
    `;

    const dispatch = await dispatchEmail({
      to: input.email.trim(),
      subject: `[QuantumShield AI] ${referenceId} — ${
        input.mode === 'demo' ? 'Executive Demo Confirmed' : 'Readiness Assessment Initiated'
      }`,
      textBody,
      htmlBody,
    });

    return res.json({
      ok: true,
      referenceId,
      fullName: safeName,
      organization: safeOrg,
      email: input.email.trim(),
      sector: safeSector,
      mode: input.mode,
      selectedPlan: safePlan,
      submittedAt: new Date().toISOString(),
      ...dispatch,
    });
  });

  // Real Security Alert Email Dispatch for Live Scanned Nodes
  app.post('/api/alerts/send', async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const targetHost = typeof req.body?.targetHost === 'string' ? req.body.targetHost.trim() : '';
    const readinessScore = Number(req.body?.readinessScore ?? 0);
    const riskIndex = Number(req.body?.riskIndex ?? 0);
    const status = typeof req.body?.status === 'string' ? req.body.status : 'Transitioning';
    const aiSummary = typeof req.body?.aiSummary === 'string' ? req.body.aiSummary : '';
    const recommendedSteps = Array.isArray(req.body?.recommendedSteps)
      ? req.body.recommendedSteps.slice(0, 6).map((s: unknown) => String(s))
      : [];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !targetHost) {
      return res.status(400).json({ error: 'Valid recipient email and target host are required.' });
    }

    const safeHost = sanitizeHeaderValue(targetHost, 200);
    const textBody = [
      `QuantumShield AI Security Alert — ${safeHost}`,
      `Readiness Score: ${readinessScore}/100 | Risk Index: ${riskIndex} | Posture: ${status}`,
      '',
      `Analysis: ${aiSummary}`,
      '',
      'Recommended Remediation Steps:',
      ...recommendedSteps.map((s: string, i: number) => `${i + 1}. ${s}`),
    ].join('\n');

    const htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;background:#05070E;color:#E2E8F0;padding:24px;border-radius:12px;">
        <h2 style="color:#00FFFF;margin:0 0 12px;">QuantumShield AI Defense Alert: ${safeHost.replace(/[<>&]/g, '')}</h2>
        <p><strong>Readiness Score:</strong> ${readinessScore}/100 · <strong>Risk Index:</strong> ${riskIndex} · <strong>Status:</strong> ${status.replace(/[<>&]/g, '')}</p>
        <p>${aiSummary.replace(/[<>&]/g, '')}</p>
        <h3 style="color:#E2E8F0;">Remediation Steps</h3>
        <ol>${recommendedSteps
          .map((s: string) => `<li>${s.replace(/[<>&]/g, '')}</li>`)
          .join('')}</ol>
      </div>
    `;

    const dispatch = await dispatchEmail({
      to: email,
      subject: `[QuantumShield Alert] ${safeHost} — Readiness ${readinessScore}/100 (${status})`,
      textBody,
      htmlBody,
    });

    return res.json({ ok: true, ...dispatch });
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  const hasDistBuild = fs.existsSync(path.join(distDir, 'index.html'));

  if (process.env.NODE_ENV !== 'production' || !hasDistBuild) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: disableHmr ? false : undefined,
        ws: disableHmr ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'
        ? err.status
        : 500;
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    if (!res.headersSent) {
      res.status(status).json({ error: message });
    }
  });

  const httpServer = app.listen(PORT, HOST, () => {
    console.log(`QuantumShield AI server listening on http://${HOST}:${PORT}`);
  });

  // Prevent premature socket closure behind Cloud Run / Nginx reverse proxies
  httpServer.keepAliveTimeout = 65_000;
  httpServer.headersTimeout = 66_000;
  httpServer.requestTimeout = 120_000;
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught server exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled server rejection:', reason);
});

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
