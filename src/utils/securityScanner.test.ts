import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isBlockedIpAddress,
  parseScanTarget,
  sanitizeHeaderValue,
} from './securityScanner';

test('isBlockedIpAddress rejects private, loopback, link-local, and metadata IPs', () => {
  assert.equal(isBlockedIpAddress('127.0.0.1'), true);
  assert.equal(isBlockedIpAddress('10.0.4.12'), true);
  assert.equal(isBlockedIpAddress('172.16.5.1'), true);
  assert.equal(isBlockedIpAddress('192.168.1.50'), true);
  assert.equal(isBlockedIpAddress('169.254.169.254'), true);
  assert.equal(isBlockedIpAddress('::1'), true);
  assert.equal(isBlockedIpAddress('::ffff:127.0.0.1'), true);
  assert.equal(isBlockedIpAddress('1.1.1.1'), false);
  assert.equal(isBlockedIpAddress('8.8.8.8'), false);
});

test('parseScanTarget normalizes valid domains and rejects local/private/credential targets', () => {
  const valid = parseScanTarget('cloudflare.com');
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.target.hostname, 'cloudflare.com');
    assert.equal(valid.target.protocol, 'https:');
    assert.equal(valid.target.port, 443);
  }

  const localRes = parseScanTarget('http://localhost:3000');
  assert.equal(localRes.ok, false);

  const metaRes = parseScanTarget('http://169.254.169.254/latest/meta-data');
  assert.equal(metaRes.ok, false);

  const credRes = parseScanTarget('https://user:pass@example.com');
  assert.equal(credRes.ok, false);
});

test('sanitizeHeaderValue strips CR/LF injection sequences', () => {
  const cleaned = sanitizeHeaderValue('Alice\r\nBcc: attacker@evil.com');
  assert.equal(cleaned.includes('\r'), false);
  assert.equal(cleaned.includes('\n'), false);
  assert.equal(cleaned, 'Alice Bcc: attacker@evil.com');
});
