export interface OrbNode {
  x: number;
  y: number;
  z: number;
  radius: number;
  phase: number;
  colorHex: number;
}

export interface NetworkEdge {
  fromIndex: number;
  toIndex: number;
}

const ORB_PALETTE = [0x00ffff, 0x2d7ff9, 0x7c3aed, 0x06b6d4] as const;

export function generateOrbNodes(count = 28): OrbNode[] {
  const safeCount = Math.max(1, Math.floor(count));
  const nodes: OrbNode[] = [];

  for (let i = 0; i < safeCount; i++) {
    // Deterministic golden-angle / quasi-random spatial spread across hero backdrop
    const t = i / safeCount;
    const goldenAngle = i * 2.399963229728653;
    const ringRadius = 2.4 + (i % 5) * 1.15;

    const x = Math.cos(goldenAngle) * ringRadius * 1.35;
    const y = Math.sin(goldenAngle * 0.85) * (2.1 + (i % 3) * 0.75) + (t - 0.5) * 1.2;
    const z = -1.2 - ((i * 7) % 11) * 0.38;
    const radius = Number((0.08 + (i % 4) * 0.045).toFixed(4));
    const phase = Number((i * 0.65).toFixed(4));
    const colorHex = ORB_PALETTE[i % ORB_PALETTE.length];

    nodes.push({ x, y, z, radius, phase, colorHex });
  }

  return nodes;
}

export function computeNetworkEdges(
  nodes: OrbNode[],
  maxDistance = 3.8,
  maxEdgesPerNode = 3
): NetworkEdge[] {
  const edges: NetworkEdge[] = [];
  const edgeCounts = new Array<number>(nodes.length).fill(0);
  const maxDistSq = maxDistance * maxDistance;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (edgeCounts[i] >= maxEdgesPerNode || edgeCounts[j] >= maxEdgesPerNode) {
        continue;
      }
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq > 0 && distSq <= maxDistSq) {
        edges.push({ fromIndex: i, toIndex: j });
        edgeCounts[i] += 1;
        edgeCounts[j] += 1;
      }
    }
  }

  return edges;
}
