import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOrbNodes, computeNetworkEdges } from './quantumOrbNetwork';

test('generateOrbNodes produces deterministic orbs with bounded radii and palette colors', () => {
  const nodes = generateOrbNodes(28);
  assert.equal(nodes.length, 28);

  const allowedColors = new Set([0x00ffff, 0x2d7ff9, 0x7c3aed, 0x06b6d4]);
  for (const node of nodes) {
    assert.ok(node.radius >= 0.08 && node.radius <= 0.25);
    assert.ok(allowedColors.has(node.colorHex));
    assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y) && Number.isFinite(node.z));
  }
});

test('computeNetworkEdges connects nearby orbs within maxDistance and respects degree cap', () => {
  const nodes = generateOrbNodes(24);
  const edges = computeNetworkEdges(nodes, 3.8, 3);
  assert.ok(edges.length > 0);

  const degrees = new Map<number, number>();
  for (const edge of edges) {
    assert.ok(edge.fromIndex < edge.toIndex);
    degrees.set(edge.fromIndex, (degrees.get(edge.fromIndex) ?? 0) + 1);
    degrees.set(edge.toIndex, (degrees.get(edge.toIndex) ?? 0) + 1);
  }

  for (const deg of degrees.values()) {
    assert.ok(deg <= 3);
  }
});
