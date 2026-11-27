export interface ParsedTarget {
  url: string;
  hostname: string;
  port: number;
  protocol: 'http:' | 'https:';
}

export interface LiveTlsTelemetry {
  tlsVersion: string;
  cipherName: string;
  keyExchangeBits: number | null;
  certSubject: string;
  certIssuer: string;
  certValidTo: string;
  headersPresent: string[];
  headersMissing: string[];
  httpStatus: number | null;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
]);

export function isBlockedIpAddress(ip: string): boolean {
  const clean = ip.trim().toLowerCase();
  if (!clean) return true;

  // Strip IPv6 zone ID if present
  const noZone = clean.split('%')[0];

  // IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1
  if (noZone.startsWith('::ffff:')) {
    return isBlockedIpAddress(noZone.slice(7));
  }

  // IPv6 loopback, unspecified, link-local (fe80::/10), unique-local (fc00::/7)
  if (noZone.includes(':')) {
    if (noZone === '::' || noZone === '::1') return true;
    if (/^fe[89ab][0-9a-f]:/i.test(noZone) || noZone.startsWith('fe80:')) return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(noZone)) return true;
    return false;
  }

  const parts = noZone.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }

  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // Multicast & reserved

  return false;
}

export function parseScanTarget(rawInput: string): { ok: true; target: ParsedTarget } | { ok: false; error: string } {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 253) {
    return { ok: false, error: 'Please enter a valid public domain or HTTPS URL (3–253 characters).' };
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: 'Invalid domain or URL format.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Only http:// and https:// targets are supported.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'URLs containing embedded credentials are not allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    hostname.length < 3 ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return { ok: false, error: 'Local, loopback, and internal metadata hostnames cannot be scanned.' };
  }

  // Block raw literal IP inputs inside private ranges immediately
  if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
    if (isBlockedIpAddress(hostname.replace(/^\[|\]$/g, ''))) {
      return { ok: false, error: 'Private or reserved IP addresses cannot be scanned.' };
    }
  }

  const port = parsed.port
    ? Number(parsed.port)
    : parsed.protocol === 'https:'
    ? 443
    : 80;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'Target port is out of valid range.' };
  }

  return {
    ok: true,
    target: {
      url: `${parsed.protocol}//${hostname}${parsed.port ? `:${port}` : ''}${parsed.pathname || '/'}`,
      hostname,
      port,
      protocol: parsed.protocol,
    },
  };
}

export function sanitizeHeaderValue(value: string, maxLen = 160): string {
  return value.replace(/[\r\n\0]+/g, ' ').trim().slice(0, maxLen);
}

export function clampBlueprintString(value: string, maxLen: number): string {
  const clean = value.trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) : clean;
}
