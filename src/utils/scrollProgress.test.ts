import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScrollProgress } from './scrollProgress';

test('computeScrollProgress returns 0 at top and clamps negative scroll', () => {
  assert.equal(computeScrollProgress(0, 5000, 900), 0);
  assert.equal(computeScrollProgress(-40, 5000, 900), 0);
});

test('computeScrollProgress returns intermediate ratio and 1 at bottom', () => {
  assert.equal(computeScrollProgress(2050, 5000, 900), 0.5);
  assert.equal(computeScrollProgress(4100, 5000, 900), 1);
  assert.equal(computeScrollProgress(4500, 5000, 900), 1);
});

test('computeScrollProgress handles non-scrollable documents safely', () => {
  assert.equal(computeScrollProgress(0, 900, 900), 0);
  assert.equal(computeScrollProgress(100, 600, 900), 0);
});
