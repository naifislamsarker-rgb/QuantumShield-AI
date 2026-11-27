import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendTerminalLog,
  createInitialTerminalLogs,
  createTerminalLogEntry,
  formatTerminalTimestamp,
  MAX_TERMINAL_LOGS,
} from './copilotTerminalLogs.ts';

test('createInitialTerminalLogs includes ML-DSA verification and AI forgery detection messages', () => {
  const logs = createInitialTerminalLogs(new Date('2026-11-26T12:00:10Z'));
  assert.equal(logs.length, 4);
  assert.ok(
    logs.some((l) => l.message.includes('ML-DSA signature verification successful')),
    'Expected initial logs to include ML-DSA signature verification message'
  );
  assert.ok(
    logs.some((l) => l.message.includes('AI forgery pattern detection active')),
    'Expected initial logs to include AI forgery pattern detection message'
  );
});

test('appendTerminalLog maintains FIFO bound up to MAX_TERMINAL_LOGS', () => {
  let logs = createInitialTerminalLogs();
  for (let i = 0; i < MAX_TERMINAL_LOGS + 10; i++) {
    logs = appendTerminalLog(
      logs,
      createTerminalLogEntry('VERIFY', `Check #${i}`, new Date(), i)
    );
  }
  assert.equal(logs.length, MAX_TERMINAL_LOGS);
  assert.equal(logs[logs.length - 1].message, `Check #${MAX_TERMINAL_LOGS + 9}`);
});

test('formatTerminalTimestamp formats HH:MM:SS cleanly', () => {
  const sample = new Date(2026, 10, 26, 9, 5, 7);
  assert.equal(formatTerminalTimestamp(sample), '09:05:07');
});
