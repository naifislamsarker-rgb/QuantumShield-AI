import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSectorReadiness,
  applySectorMitigations,
  generateCopilotResponse,
  filterThreatNodes,
  sortThreatNodes,
  buildThreatNodesCsv,
  calculatePricingQuote,
  validateAssessmentRequest,
  type ThreatNodeRecord,
} from './quantumReadiness';

test('getSectorReadiness returns 78 national composite and distinct sector scores', () => {
  const national = getSectorReadiness('national');
  assert.equal(national.score, 78);

  const healthcare = getSectorReadiness('healthcare');
  const government = getSectorReadiness('government');
  assert.equal(healthcare.score, 74);
  assert.equal(government.score, 83);
  assert.ok(healthcare.recommendations.length >= 3);
});

test('applySectorMitigations recalculates score, risk index, and migration pct deterministically', () => {
  const base = getSectorReadiness('healthcare');
  const oneApplied = applySectorMitigations('healthcare', [0]);
  const allApplied = applySectorMitigations('healthcare', [0, 1, 2]);

  assert.equal(oneApplied.score, base.score + 5);
  assert.equal(oneApplied.riskIndex, base.riskIndex - 6);
  assert.equal(allApplied.score, base.score + 15);
  assert.equal(allApplied.statusLabel, 'Resilient');
});

test('generateCopilotResponse returns exact high-risk exposure answer for vulnerability prompt', () => {
  const res = generateCopilotResponse('How vulnerable is my infrastructure?');
  assert.equal(
    res.answer,
    'Three legacy authentication mechanisms and two outdated encryption systems have been identified as high-risk quantum exposure points.'
  );
  assert.equal(res.findings.length, 3);
});

test('generateCopilotResponse adapts response to sector-specific queries', () => {
  const healthRes = generateCopilotResponse('Analyze our hospital EMR telemedicine gateways');
  assert.match(healthRes.answer, /Healthcare telemetry/i);

  const microRes = generateCopilotResponse('Check microfinance loan payment risk');
  assert.match(microRes.answer, /Microfinance core gateways/i);
});

test('filterThreatNodes and sortThreatNodes filter and order nodes cleanly', () => {
  const sample: ThreatNodeRecord[] = [
    {
      id: '1',
      institution: 'Dhaka Medical Cloud Gateway',
      sector: 'healthcare',
      region: 'Dhaka',
      protocol: 'TLS 1.3 + ML-KEM',
      readinessScore: 76,
      riskIndex: 38,
      status: 'Transitioning',
    },
    {
      id: '2',
      institution: 'Grameen Digital Ledger Node',
      sector: 'microfinance',
      region: 'Rajshahi',
      protocol: 'RSA-2048 Legacy',
      readinessScore: 68,
      riskIndex: 47,
      status: 'Action Required',
    },
  ];

  assert.equal(filterThreatNodes(sample, 'all', '').length, 2);
  assert.equal(filterThreatNodes(sample, 'healthcare', '').length, 1);
  assert.equal(filterThreatNodes(sample, 'all', 'rajshahi').length, 1);
  assert.equal(filterThreatNodes(sample, 'microfinance', 'dhaka').length, 0);

  const sortedDesc = sortThreatNodes(sample, 'readinessScore', 'desc');
  assert.equal(sortedDesc[0].id, '1');
  const sortedAsc = sortThreatNodes(sample, 'readinessScore', 'asc');
  assert.equal(sortedAsc[0].id, '2');
});

test('buildThreatNodesCsv generates valid CSV and neutralizes formula injection', () => {
  const sample: ThreatNodeRecord[] = [
    {
      id: 'qs-1',
      institution: '=cmd|calc',
      sector: 'industry',
      region: 'Chattogram, BD',
      protocol: 'TLS 1.3',
      readinessScore: 80,
      riskIndex: 25,
      status: 'Quantum-Ready',
    },
  ];

  const csv = buildThreatNodesCsv(sample);
  assert.match(csv, /^ID,Institution \/ Node,/);
  assert.match(csv, /'=cmd\|calc/);
  assert.match(csv, /"Chattogram, BD"/);
});

test('calculatePricingQuote computes annual 20% discount and enterprise custom quote', () => {
  const monthlyStarter = calculatePricingQuote('starter', 'monthly');
  const annualStarter = calculatePricingQuote('starter', 'annual');
  assert.equal(monthlyStarter.priceLabel, '$490');
  assert.equal(annualStarter.priceLabel, '$392');

  const enterprise = calculatePricingQuote('enterprise', 'annual');
  assert.equal(enterprise.priceLabel, 'Custom');
});

test('validateAssessmentRequest enforces required fields and email format', () => {
  const invalid = validateAssessmentRequest({
    fullName: '',
    organization: 'A',
    email: 'invalid-email',
    sector: '',
    mode: 'demo',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.organization);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.sector);

  const valid = validateAssessmentRequest({
    fullName: 'Tariq Rahman',
    organization: 'National Health Digital Directorate',
    email: 'tariq@nhdd.gov.bd',
    sector: 'Government',
    mode: 'assessment',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});
