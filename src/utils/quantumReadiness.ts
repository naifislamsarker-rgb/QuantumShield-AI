export type SectorId =
  | 'national'
  | 'healthcare'
  | 'microfinance'
  | 'education'
  | 'government'
  | 'industry';

export type TimeframeId = '30d' | '90d' | '1y';
export type PricingTierId = 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type RequestMode = 'demo' | 'assessment';
export type ThreatSortKey = 'institution' | 'readinessScore' | 'riskIndex';
export type SortDirection = 'asc' | 'desc';

export interface SectorReadinessProfile {
  id: SectorId;
  label: string;
  score: number;
  riskIndex: number;
  pqcMigrationPct: number;
  exposedEndpoints: number;
  legacyCryptoCount: number;
  statusLabel: 'Resilient' | 'Moderate Exposure' | 'Elevated Risk';
  summary: string;
  recommendations: string[];
}

export interface CopilotFinding {
  id: string;
  category: string;
  severity: 'High' | 'Medium' | 'Advisory';
  detail: string;
}

export interface CopilotResponsePayload {
  answer: string;
  readinessImpact: string;
  findings: CopilotFinding[];
  recommendedAction: string;
}

export interface ThreatNodeRecord {
  id: string;
  institution: string;
  sector: Exclude<SectorId, 'national'>;
  region: string;
  protocol: string;
  readinessScore: number;
  riskIndex: number;
  status: 'Quantum-Ready' | 'Transitioning' | 'Action Required';
}

export interface ContactFormInput {
  fullName: string;
  organization: string;
  email: string;
  sector: string;
  mode: RequestMode;
  selectedPlan?: string;
  notes?: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormInput, string>>;
}

export interface StoredSubmissionReceipt {
  referenceId: string;
  fullName: string;
  organization: string;
  email: string;
  sector: string;
  mode: RequestMode;
  selectedPlan: string;
  submittedAt: string;
}

export const SECTOR_READINESS_PROFILES: Record<SectorId, SectorReadinessProfile> = {
  national: {
    id: 'national',
    label: 'National Composite',
    score: 78,
    riskIndex: 34,
    pqcMigrationPct: 62,
    exposedEndpoints: 184,
    legacyCryptoCount: 14,
    statusLabel: 'Moderate Exposure',
    summary:
      'Aggregate readiness across monitored Bangladeshi healthcare, microfinance, education, government, and industrial infrastructure.',
    recommendations: [
      'Transition high-volume RSA-2048 TLS termination gateways to ML-KEM-768 hybrid key encapsulation.',
      'Enforce ML-DSA-65 code and credential signing across national digital service APIs.',
      'Quarantine three legacy SAML/OIDC authentication bridges before Q4 compliance audits.',
    ],
  },
  healthcare: {
    id: 'healthcare',
    label: 'Healthcare',
    score: 74,
    riskIndex: 42,
    pqcMigrationPct: 54,
    exposedEndpoints: 49,
    legacyCryptoCount: 5,
    statusLabel: 'Elevated Risk',
    summary:
      'Hospital EMR databases, telemedicine portals, and digital prescription gateways carrying long-lived patient records vulnerable to harvest-now-decrypt-later.',
    recommendations: [
      'Encrypt archival HL7/FHIR patient records with post-quantum hybrid symmetric envelopes.',
      'Upgrade telemedicine session brokers from ECDHE-P256 to ML-KEM-768.',
      'Enable continuous anomaly monitoring on prescription signing endpoints.',
    ],
  },
  microfinance: {
    id: 'microfinance',
    label: 'Microfinance',
    score: 81,
    riskIndex: 31,
    pqcMigrationPct: 68,
    exposedEndpoints: 36,
    legacyCryptoCount: 3,
    statusLabel: 'Moderate Exposure',
    summary:
      'Loan origination cores, mobile wallet settlements, and borrower KYC ledgers operating across urban and rural branches.',
    recommendations: [
      'Migrate agent banking API gateways to quantum-safe mutual TLS authentication.',
      'Apply real-time AI fraud scoring to rural disbursement settlement batches.',
      'Rotate legacy RSA-2048 branch signing certificates to hybrid ML-DSA tokens.',
    ],
  },
  education: {
    id: 'education',
    label: 'Education',
    score: 76,
    riskIndex: 36,
    pqcMigrationPct: 58,
    exposedEndpoints: 31,
    legacyCryptoCount: 3,
    statusLabel: 'Moderate Exposure',
    summary:
      'University student information systems, learning portals, and national academic credential registries.',
    recommendations: [
      'Adopt tamper-evident post-quantum signatures on issued degrees and transcripts.',
      'Harden student SSO portals against credential stuffing and session hijacking.',
      'Segment research cloud clusters from administrative student databases.',
    ],
  },
  government: {
    id: 'government',
    label: 'Government',
    score: 83,
    riskIndex: 27,
    pqcMigrationPct: 71,
    exposedEndpoints: 41,
    legacyCryptoCount: 2,
    statusLabel: 'Resilient',
    summary:
      'Citizen service portals, digital identity exchanges, and inter-ministry public infrastructure gateways.',
    recommendations: [
      'Complete hybrid PQC rollout across national citizen portal ingress controllers.',
      'Mandate cryptographic inventory attestation for all third-party civic vendors.',
      'Enable automated key-rotation telemetry across ministry data exchanges.',
    ],
  },
  industry: {
    id: 'industry',
    label: 'Industry',
    score: 71,
    riskIndex: 46,
    pqcMigrationPct: 48,
    exposedEndpoints: 27,
    legacyCryptoCount: 6,
    statusLabel: 'Elevated Risk',
    summary:
      'Smart manufacturing lines, industrial IoT telemetry brokers, and national power & energy SCADA networks.',
    recommendations: [
      'Isolate legacy PLC/SCADA controllers behind post-quantum edge security proxies.',
      'Enforce hardware-backed device identity attestation for factory IoT gateways.',
      'Audit firmware update pipelines for quantum-safe signature verification.',
    ],
  },
};

export function getSectorReadiness(sectorId: SectorId): SectorReadinessProfile {
  return SECTOR_READINESS_PROFILES[sectorId] ?? SECTOR_READINESS_PROFILES.national;
}

export function applySectorMitigations(
  sectorId: SectorId,
  appliedIndices: number[]
): SectorReadinessProfile {
  const base = getSectorReadiness(sectorId);
  const validUnique = Array.from(
    new Set(appliedIndices.filter((i) => Number.isInteger(i) && i >= 0 && i < base.recommendations.length))
  );

  if (validUnique.length === 0) {
    return base;
  }

  const count = validUnique.length;
  const score = Math.min(98, base.score + count * 5);
  const riskIndex = Math.max(8, base.riskIndex - count * 6);
  const pqcMigrationPct = Math.min(99, base.pqcMigrationPct + count * 10);
  const legacyCryptoCount = Math.max(0, base.legacyCryptoCount - count * 2);
  const statusLabel: SectorReadinessProfile['statusLabel'] =
    score >= 83 ? 'Resilient' : score >= 75 ? 'Moderate Exposure' : 'Elevated Risk';

  return {
    ...base,
    score,
    riskIndex,
    pqcMigrationPct,
    legacyCryptoCount,
    statusLabel,
  };
}

export function generateCopilotResponse(query: string): CopilotResponsePayload {
  const normalized = query.trim().toLowerCase();

  if (
    normalized.includes('vulnerable') ||
    normalized.includes('how vulnerable') ||
    normalized === ''
  ) {
    return {
      answer:
        'Three legacy authentication mechanisms and two outdated encryption systems have been identified as high-risk quantum exposure points.',
      readinessImpact: 'Resolving these 5 findings raises your Quantum Readiness Score from 78 to 91 (+13 pts).',
      findings: [
        {
          id: 'auth-legacy',
          category: 'Authentication',
          severity: 'High',
          detail: '3 legacy authentication mechanisms (RSA-1024 SAML & SHA-1 token signing)',
        },
        {
          id: 'enc-outdated',
          category: 'Encryption',
          severity: 'High',
          detail: '2 outdated encryption systems (TLS 1.2 RSA key exchange & static ECDH)',
        },
        {
          id: 'pqc-bridge',
          category: 'Post-Quantum Migration',
          severity: 'Advisory',
          detail: 'Hybrid ML-KEM-768 + ML-DSA-65 migration blueprint prepared for zero-downtime rollout',
        },
      ],
      recommendedAction:
        'Deploy QuantumShield hybrid TLS wrapper on ingress nodes first, then rotate legacy SAML identity certificates.',
    };
  }

  if (normalized.includes('health') || normalized.includes('hospital') || normalized.includes('patient')) {
    return {
      answer:
        'Healthcare telemetry shows elevated harvest-now-decrypt-later exposure across 49 EMR and telemedicine endpoints storing long-retention patient records.',
      readinessImpact: 'Upgrading EMR archives to hybrid ML-KEM raises Healthcare Readiness from 74 to 89.',
      findings: [
        {
          id: 'emr-at-rest',
          category: 'Patient Records',
          severity: 'High',
          detail: 'Legacy RSA-2048 key wrapping detected on regional hospital backup vaults',
        },
        {
          id: 'telemed-rtc',
          category: 'Telemedicine',
          severity: 'Medium',
          detail: '2 signaling gateways lack quantum-safe ephemeral key exchange',
        },
      ],
      recommendedAction:
        'Activate QuantumShield HealthSecure archive re-encryption and enforce automated prescription token signing.',
    };
  }

  if (normalized.includes('microfinance') || normalized.includes('loan') || normalized.includes('payment')) {
    return {
      answer:
        'Microfinance core gateways score 81/100 overall, with primary exposure concentrated in 3 rural branch settlement bridges and legacy merchant signing keys.',
      readinessImpact: 'Rotating branch API keys increases Microfinance Readiness from 81 to 93.',
      findings: [
        {
          id: 'loan-core',
          category: 'Loan Systems',
          severity: 'Medium',
          detail: '3 branch disbursement relays still negotiate non-PQC cipher suites',
        },
        {
          id: 'fraud-ai',
          category: 'Fraud Defense',
          severity: 'Advisory',
          detail: 'AI anomaly detector monitoring 14,200+ daily micro-transactions with 0.2% false positives',
        },
      ],
      recommendedAction:
        'Enable QuantumShield MicroFinance mutual-TLS policy and schedule staged ML-DSA certificate rollout.',
    };
  }

  if (
    normalized.includes('gov') ||
    normalized.includes('citizen') ||
    normalized.includes('public') ||
    normalized.includes('industry') ||
    normalized.includes('factory') ||
    normalized.includes('iot')
  ) {
    return {
      answer:
        'Critical public infrastructure and industrial OT grids show mixed readiness: Government services lead at 83/100 while Industrial IoT networks require immediate gateway isolation at 71/100.',
      readinessImpact: 'Deploying OT edge proxies closes 6 critical SCADA/IoT exposure points.',
      findings: [
        {
          id: 'scada-iot',
          category: 'Operational Technology',
          severity: 'High',
          detail: '6 factory telemetry brokers communicate using unauthenticated or pre-quantum keys',
        },
        {
          id: 'civic-portal',
          category: 'Citizen Services',
          severity: 'Medium',
          detail: '2 inter-agency API bridges queued for ML-KEM-1024 upgrade',
        },
      ],
      recommendedAction:
        'Deploy QuantumShield Industrial edge proxies in monitor-only mode before enforcing PQC packet wrapping.',
    };
  }

  return {
    answer:
      'Continuous infrastructure scan complete: 78/100 composite Quantum Readiness Score with zero active intrusions, 5 prioritized cryptographic upgrades, and full ML-KEM/ML-DSA migration path mapped.',
    readinessImpact: 'Applying top 3 AI Copilot recommendations yields an estimated +11 point readiness gain.',
    findings: [
      {
        id: 'crypto-inventory',
        category: 'Crypto Inventory',
        severity: 'Medium',
        detail: '14 legacy asymmetric certificates flagged across monitored production APIs',
      },
      {
        id: 'compliance-posture',
        category: 'Compliance',
        severity: 'Advisory',
        detail: 'Aligned with NIST FIPS 203/204 transition milestones and Bangladesh national cyber resilience policy',
      },
    ],
    recommendedAction:
      'Export the executive migration roadmap or initiate a guided Readiness Assessment with QuantumShield engineers.',
  };
}

export function filterThreatNodes(
  nodes: ThreatNodeRecord[],
  sectorFilter: 'all' | Exclude<SectorId, 'national'>,
  searchQuery: string
): ThreatNodeRecord[] {
  const q = searchQuery.trim().toLowerCase();
  return nodes.filter((node) => {
    const matchesSector = sectorFilter === 'all' || node.sector === sectorFilter;
    if (!matchesSector) return false;
    if (!q) return true;
    return (
      node.institution.toLowerCase().includes(q) ||
      node.region.toLowerCase().includes(q) ||
      node.protocol.toLowerCase().includes(q) ||
      node.sector.toLowerCase().includes(q)
    );
  });
}

export function sortThreatNodes(
  nodes: ThreatNodeRecord[],
  sortKey: ThreatSortKey,
  sortDir: SortDirection
): ThreatNodeRecord[] {
  const multiplier = sortDir === 'asc' ? 1 : -1;
  return [...nodes].sort((a, b) => {
    if (sortKey === 'institution') {
      return a.institution.localeCompare(b.institution) * multiplier;
    }
    return (a[sortKey] - b[sortKey]) * multiplier;
  });
}

function escapeCsvCell(raw: string | number): string {
  const str = String(raw);
  // Neutralize spreadsheet formula triggers if cell starts with =, +, -, or @
  const safeStr = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }
  return safeStr;
}

export function buildThreatNodesCsv(nodes: ThreatNodeRecord[]): string {
  const headers = [
    'ID',
    'Institution / Node',
    'Sector',
    'Region',
    'Cryptographic Profile',
    'Readiness Score',
    'Risk Index',
    'Posture Status',
  ];
  const rows = nodes.map((n) =>
    [
      n.id,
      n.institution,
      n.sector,
      n.region,
      n.protocol,
      `${n.readinessScore}/100`,
      n.riskIndex,
      n.status,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

export function calculatePricingQuote(
  tierId: PricingTierId,
  billingCycle: BillingCycle
): { priceLabel: string; cadenceLabel: string; savingsNote: string } {
  if (tierId === 'enterprise') {
    return {
      priceLabel: 'Custom',
      cadenceLabel: 'National & Sovereign SLA',
      savingsNote: 'Dedicated Dhaka SOC & On-Premise Quantum Gateway',
    };
  }

  const baseMonthly = tierId === 'starter' ? 490 : 1850;
  const price = billingCycle === 'annual' ? Math.round(baseMonthly * 0.8) : baseMonthly;
  return {
    priceLabel: `$${price.toLocaleString('en-US')}`,
    cadenceLabel: billingCycle === 'annual' ? '/ month, billed annually' : '/ month, billed monthly',
    savingsNote:
      billingCycle === 'annual'
        ? `Save 20% annually ($${((baseMonthly - price) * 12).toLocaleString('en-US')}/yr)`
        : 'Flexible monthly enterprise licensing',
  };
}

export function validateAssessmentRequest(input: ContactFormInput): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormInput, string>> = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }

  if (!input.organization || input.organization.trim().length < 2) {
    errors.organization = 'Please enter your organization or ministry name.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailPattern.test(input.email.trim())) {
    errors.email = 'Please enter a valid institutional or work email address.';
  }

  if (!input.sector || input.sector.trim().length === 0) {
    errors.sector = 'Please select your primary infrastructure sector.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeStorageSet(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private-mode restriction
  }
}

export function safeStorageRemove(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage restriction
  }
}
