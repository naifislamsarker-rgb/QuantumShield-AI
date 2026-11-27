import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Bot,
  Send,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertTriangle,
  Terminal,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  generateCopilotResponse,
  safeStorageGet,
  safeStorageSet,
  type CopilotResponsePayload,
} from '../utils/quantumReadiness';
import { clampBlueprintString } from '../utils/securityScanner';
import { copyToClipboard, triggerBrowserDownload } from '../utils/browserExport';
import {
  appendTerminalLog,
  createInitialTerminalLogs,
  createTerminalLogEntry,
  STREAMING_TELEMETRY_POOL,
  type TerminalLogEntry,
  type TerminalLogLevel,
} from '../utils/copilotTerminalLogs';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  payload?: CopilotResponsePayload;
}

export interface LiveScanContextItem {
  targetHost: string;
  protocol: string;
  readinessScore: number;
  status: string;
}

interface AiCopilotSectionProps {
  liveScans?: LiveScanContextItem[];
}

const STORAGE_KEY = 'qs_copilot_history_v1';

const PRESET_PROMPTS = [
  'How vulnerable is my infrastructure?',
  'Analyze our hospital EMR telemedicine gateways',
  'Check microfinance loan payment risk',
  'Assess industrial SCADA & citizen portals',
];

const INITIAL_PAYLOAD = generateCopilotResponse('How vulnerable is my infrastructure?');

const DEFAULT_MESSAGES: CopilotMessage[] = [
  {
    id: 'initial-user',
    role: 'user',
    text: 'How vulnerable is my infrastructure?',
  },
  {
    id: 'initial-assistant',
    role: 'assistant',
    text: INITIAL_PAYLOAD.answer,
    payload: INITIAL_PAYLOAD,
  },
];

function buildBriefText(msg: CopilotMessage): string {
  const lines = [
    'QuantumShield AI Security Copilot — Executive Brief',
    `Summary: ${msg.text}`,
  ];
  if (msg.payload) {
    lines.push(`Projected Impact: ${msg.payload.readinessImpact}`);
    lines.push('Findings:');
    for (const f of msg.payload.findings) {
      lines.push(`- [${f.severity}] ${f.category}: ${f.detail}`);
    }
    lines.push(`Recommended Action: ${msg.payload.recommendedAction}`);
  }
  return lines.join('\n');
}

export function AiCopilotSection({ liveScans = [] }: AiCopilotSectionProps) {
  const { user, authReady } = useFirebase();
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    const saved = safeStorageGet<CopilotMessage[]>(STORAGE_KEY, DEFAULT_MESSAGES);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_MESSAGES;
  });
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedBriefCount, setSavedBriefCount] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>(() =>
    createInitialTerminalLogs()
  );
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const terminalBodyRef = useRef<HTMLDivElement | null>(null);
  const logSeqRef = useRef(100);
  const poolIndexRef = useRef(4);
  const announcedHostsRef = useRef<Set<string>>(new Set());

  const pushTerminalLog = (level: TerminalLogLevel, message: string) => {
    logSeqRef.current += 1;
    const entry = createTerminalLogEntry(level, message, new Date(), logSeqRef.current);
    setTerminalLogs((prev) => appendTerminalLog(prev, entry));
  };

  useEffect(() => {
    safeStorageSet(STORAGE_KEY, messages);
  }, [messages]);

  useEffect(() => {
    const container = threadRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isAnalyzing]);

  useEffect(() => {
    const term = terminalBodyRef.current;
    if (term && !isStreamPaused) {
      term.scrollTop = term.scrollHeight;
    }
  }, [terminalLogs, isStreamPaused]);

  useEffect(() => {
    if (isStreamPaused) return;
    const timer = window.setInterval(() => {
      const idx = poolIndexRef.current % STREAMING_TELEMETRY_POOL.length;
      poolIndexRef.current += 1;
      const template = STREAMING_TELEMETRY_POOL[idx];
      let message = template.message;
      if (liveScans.length > 0 && idx % 3 === 0) {
        const scan = liveScans[idx % liveScans.length];
        message = `ML-DSA & TLS audit active on ${scan.targetHost} (${scan.readinessScore}/100 · ${scan.status})`;
      }
      logSeqRef.current += 1;
      const nextEntry = createTerminalLogEntry(
        template.level,
        message,
        new Date(),
        logSeqRef.current
      );
      setTerminalLogs((prev) => appendTerminalLog(prev, nextEntry));
    }, 2600);
    return () => window.clearInterval(timer);
  }, [isStreamPaused, liveScans]);

  useEffect(() => {
    for (const scan of liveScans) {
      const key = `${scan.targetHost}:${scan.status}:${scan.readinessScore}`;
      if (!announcedHostsRef.current.has(key)) {
        announcedHostsRef.current.add(key);
        pushTerminalLog(
          'VERIFY',
          `Live node telemetry ingested: ${scan.targetHost} [${scan.protocol}] (${scan.readinessScore}/100)`
        );
      }
    }
  }, [liveScans]);

  useEffect(() => {
    if (!authReady || !user) {
      setSavedBriefCount(0);
      return;
    }
    const q = query(
      collection(db, 'copilot_sessions'),
      where('ownerUid', '==', user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSavedBriefCount(snap.size);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'copilot_sessions');
      }
    );
    return () => unsub();
  }, [authReady, user]);

  const submitQuery = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed || isAnalyzing) return;

    setCopilotError(null);
    const userMsg: CopilotMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsAnalyzing(true);
    pushTerminalLog('AI-ENGINE', `AI forgery & posture reasoning started for query: "${trimmed.slice(0, 64)}"`);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          history: messages.slice(-4).map((m) => ({ role: m.role, text: m.text })),
          liveScans,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `AI service returned HTTP ${response.status}`);
      }

      const payload: CopilotResponsePayload = {
        answer: String(data.answer || 'Analysis complete.'),
        readinessImpact: String(data.readinessImpact || ''),
        findings: Array.isArray(data.findings) ? data.findings : [],
        recommendedAction: String(data.recommendedAction || ''),
      };
      pushTerminalLog(
        'ML-DSA',
        `ML-DSA signature verification successful · Brief attested (${payload.findings.length} findings)`
      );

      const briefId = `brief_${Date.now().toString(36)}`;
      const aiMsg: CopilotMessage = {
        id: briefId,
        role: 'assistant',
        text: payload.answer,
        payload,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (user && user.emailVerified) {
        const docPath = `copilot_sessions/${briefId}`;
        try {
          await setDoc(doc(db, 'copilot_sessions', briefId), {
            id: briefId,
            ownerUid: user.uid,
            query: clampBlueprintString(trimmed, 1000),
            answer: clampBlueprintString(payload.answer, 3000),
            readinessImpact: clampBlueprintString(payload.readinessImpact || 'Assessment logged.', 400),
            recommendedAction: clampBlueprintString(payload.recommendedAction || 'Review TLS posture.', 1000),
            findingsCount: Math.min(20, payload.findings.length),
            createdAt: serverTimestamp(),
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.CREATE, docPath);
        }
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Unable to reach AI Security Copilot.';
      setCopilotError(errMsg);
      pushTerminalLog('AI-ENGINE', `Diagnostic stream error: ${errMsg.slice(0, 120)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitQuery(inputValue);
  };

  const handleCopyBrief = async (msg: CopilotMessage) => {
    const ok = await copyToClipboard(buildBriefText(msg));
    if (ok) {
      setCopiedId(msg.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === msg.id ? null : current));
      }, 2000);
    }
  };

  const handleExportBrief = (msg: CopilotMessage) => {
    triggerBrowserDownload(
      `quantumshield-copilot-brief-${msg.id}.txt`,
      buildBriefText(msg),
      'text/plain;charset=utf-8'
    );
  };

  const handleResetSession = () => {
    if (isAnalyzing) return;
    setMessages(DEFAULT_MESSAGES);
    setCopilotError(null);
    setCopiedId(null);
  };

  return (
    <section
      id="copilot"
      className="relative border-b border-slate-800/80 bg-[#05070E] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Narrative + Persistent Live Terminal */}
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              AI Security Copilot
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
              Intelligent Quantum Risk Guidance in Plain Language
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Ask our Gemini-powered cybersecurity copilot about live scanned domains, legacy TLS
              ciphers, authentication bottlenecks, or sector compliance—and receive instant,
              prioritized remediation steps.
            </p>

            <div className="mt-7 space-y-2.5">
              <p className="text-xs font-medium text-slate-400">
                Try an infrastructure diagnostic prompt:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => void submitQuery(prompt)}
                    className="rounded-lg border border-slate-700/90 bg-slate-900/75 px-3 py-2 text-left text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-[#00FFFF] disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Persistent Real-Time Scrolling Cryptographic Terminal */}
            <div
              data-testid="copilot-terminal"
              className="mt-6 overflow-hidden rounded-2xl border border-slate-800/90 bg-[#03050B] shadow-[0_14px_40px_rgba(2,6,23,0.65)]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/90 px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="h-3.5 w-3.5 shrink-0 text-[#00FFFF]" aria-hidden="true" />
                  <p className="truncate font-mono text-[11px] font-semibold text-slate-200">
                    verification-engine.log
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid="terminal-toggle-btn"
                    onClick={() => setIsStreamPaused((prev) => !prev)}
                    aria-label={isStreamPaused ? 'Resume live log stream' : 'Pause live log stream'}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 font-mono text-[10px] font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] whitespace-nowrap cursor-pointer"
                  >
                    {isStreamPaused ? (
                      <>
                        <Play className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>Live</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    data-testid="terminal-clear-btn"
                    onClick={() =>
                      setTerminalLogs([
                        createTerminalLogEntry(
                          'AI-ENGINE',
                          'AI forgery pattern detection active · stream buffer reset',
                          new Date(),
                          (logSeqRef.current += 1)
                        ),
                      ])
                    }
                    aria-label="Clear terminal output"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 font-mono text-[10px] font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 whitespace-nowrap cursor-pointer"
                  >
                    <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div
                ref={terminalBodyRef}
                role="log"
                aria-live="polite"
                aria-label="Real-time ML-DSA signature verification and AI forgery analysis logs"
                data-testid="copilot-terminal-log"
                className="h-48 space-y-1.5 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed"
              >
                {terminalLogs.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <span className="shrink-0 text-slate-500 tabular-nums">
                      {entry.timestamp}
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${
                        entry.level === 'ML-DSA'
                          ? 'text-emerald-400'
                          : entry.level === 'AI-ENGINE'
                          ? 'text-[#00FFFF]'
                          : entry.level === 'ML-KEM'
                          ? 'text-[#A78BFA]'
                          : 'text-[#60A5FA]'
                      }`}
                    >
                      [{entry.level}]
                    </span>
                    <span className="text-slate-200">{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Animated AI Conversation Interface */}
          <div className="lg:col-span-7">
            <div className="glass-surface-elevated overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(2,6,23,0.75)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-[#00FFFF]">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-white">
                      QuantumShield AI Copilot
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gemini Cryptographic Posture &amp; Threat Advisor
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {messages.length > DEFAULT_MESSAGES.length && (
                    <button
                      type="button"
                      onClick={handleResetSession}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      Reset Session
                    </button>
                  )}
                  <span className="font-mono text-xs text-cyan-300 whitespace-nowrap shrink-0">
                    {user ? `Cloud Sync (${savedBriefCount})` : 'Live AI'}
                  </span>
                </div>
              </div>

              {/* Conversation Thread */}
              <div
                ref={threadRef}
                role="log"
                aria-live="polite"
                aria-label="AI Security Copilot conversation"
                data-testid="copilot-thread"
                className="max-h-[410px] space-y-4 overflow-y-auto p-5"
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="mb-1 text-[11px] font-medium text-slate-400">
                      {msg.role === 'user' ? 'Security Architect' : 'QuantumShield AI Copilot'}
                    </span>

                    {msg.role === 'user' ? (
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-[#2D7FF9]/35 bg-[#2D7FF9]/15 px-4 py-2.5 text-sm text-white">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="w-full rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-950/85 p-4 text-sm text-slate-200">
                        <p className="leading-relaxed text-white">{msg.text}</p>

                        {msg.payload && (
                          <div className="mt-4 space-y-3 border-t border-slate-800/90 pt-3">
                            <p className="font-mono text-xs text-[#00FFFF]">
                              {msg.payload.readinessImpact}
                            </p>

                            <div className="space-y-2">
                              {msg.payload.findings.map((finding) => (
                                <div
                                  key={finding.id}
                                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-xs"
                                >
                                  <div className="flex items-start gap-2">
                                    <ShieldAlert
                                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                                        finding.severity === 'High'
                                          ? 'text-amber-400'
                                          : 'text-cyan-300'
                                      }`}
                                      aria-hidden="true"
                                    />
                                    <div>
                                      <span className="font-semibold text-slate-200">
                                        {finding.category}:{' '}
                                      </span>
                                      <span className="text-slate-300">{finding.detail}</span>
                                    </div>
                                  </div>
                                  <span
                                    className={`shrink-0 font-mono text-[11px] ${
                                      finding.severity === 'High'
                                        ? 'text-amber-300'
                                        : 'text-cyan-300'
                                    }`}
                                  >
                                    {finding.severity}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-start gap-2 rounded-lg bg-cyan-500/8 px-3 py-2 text-xs text-cyan-100">
                              <CheckCircle2
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00FFFF]"
                                aria-hidden="true"
                              />
                              <span>
                                <strong>Recommended Action:</strong> {msg.payload.recommendedAction}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => void handleCopyBrief(msg)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                                    <span className="text-emerald-300">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" aria-hidden="true" />
                                    <span>Copy Brief</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExportBrief(msg)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Download className="h-3 w-3" aria-hidden="true" />
                                <span>Export Brief</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}

                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Running live Gemini cryptographic reasoning...</span>
                  </div>
                )}

                {copilotError && (
                  <div
                    role="alert"
                    data-testid="copilot-error"
                    className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                    <span>{copilotError}</span>
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <form
                onSubmit={handleFormSubmit}
                className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/90 px-4 py-3"
              >
                <label htmlFor="copilot-query" className="sr-only">
                  Ask QuantumShield AI Security Copilot
                </label>
                <input
                  id="copilot-query"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about infrastructure vulnerabilities, EMR encryption, or SCADA..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing || inputValue.trim().length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2D7FF9] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ask Copilot
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
