export type TerminalLogLevel = 'ML-DSA' | 'AI-ENGINE' | 'ML-KEM' | 'VERIFY';

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  level: TerminalLogLevel;
  message: string;
}

export const MAX_TERMINAL_LOGS = 40;

export const STREAMING_TELEMETRY_POOL: ReadonlyArray<{
  level: TerminalLogLevel;
  message: string;
}> = [
  {
    level: 'ML-DSA',
    message: 'ML-DSA signature verification successful (FIPS 204 · 2.4ms)',
  },
  {
    level: 'AI-ENGINE',
    message: 'AI forgery pattern detection active across credential & API payloads',
  },
  {
    level: 'ML-KEM',
    message: 'Hybrid X25519MLKEM768 key encapsulation channel verified',
  },
  {
    level: 'VERIFY',
    message: 'Certificate transparency & SHA-384 chain integrity check passed',
  },
  {
    level: 'AI-ENGINE',
    message: 'Deep neural anomaly scan: zero synthetic signature tampering detected',
  },
  {
    level: 'ML-DSA',
    message: 'Dual-stack ML-DSA-65 institutional attestation hash anchored',
  },
  {
    level: 'VERIFY',
    message: 'Continuous cryptographic drift monitor polling national gateway endpoints',
  },
  {
    level: 'ML-KEM',
    message: 'Harvest-now-decrypt-later entropy threshold within resilient bounds',
  },
];

export function formatTerminalTimestamp(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function createTerminalLogEntry(
  level: TerminalLogLevel,
  message: string,
  date: Date = new Date(),
  sequence?: number
): TerminalLogEntry {
  const suffix = sequence !== undefined ? sequence : Math.floor(Math.random() * 10000);
  return {
    id: `log-${date.getTime()}-${suffix}`,
    timestamp: formatTerminalTimestamp(date),
    level,
    message,
  };
}

export function appendTerminalLog(
  logs: TerminalLogEntry[],
  entry: TerminalLogEntry,
  maxEntries: number = MAX_TERMINAL_LOGS
): TerminalLogEntry[] {
  const next = [...logs, entry];
  if (next.length <= maxEntries) {
    return next;
  }
  return next.slice(next.length - maxEntries);
}

export function createInitialTerminalLogs(now: Date = new Date()): TerminalLogEntry[] {
  const offsetsMs = [-6000, -4000, -2000, 0];
  const initialItems = [
    STREAMING_TELEMETRY_POOL[0],
    STREAMING_TELEMETRY_POOL[1],
    STREAMING_TELEMETRY_POOL[2],
    STREAMING_TELEMETRY_POOL[3],
  ];
  return initialItems.map((item, idx) =>
    createTerminalLogEntry(
      item.level,
      item.message,
      new Date(now.getTime() + offsetsMs[idx]),
      idx + 1
    )
  );
}
