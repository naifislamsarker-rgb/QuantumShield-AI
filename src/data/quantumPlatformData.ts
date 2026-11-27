import type { ThreatNodeRecord, TimeframeId, PricingTierId } from '../utils/quantumReadiness';

export interface ThreatCardItem {
  id: string;
  title: string;
  metricValue: number;
  metricSuffix: string;
  metricLabel: string;
  description: string;
  sectorTag: string;
}

export const PROBLEM_STATS = [
  {
    value: 84,
    suffix: '%',
    label: 'Public & enterprise APIs relying on quantum-vulnerable RSA/ECC keys',
  },
  {
    value: 310,
    suffix: '+',
    label: 'Critical national institutions accelerating cloud & mobile digitization',
  },
  {
    value: 7,
    suffix: ' yrs',
    label: 'Recommended transition lead time for sovereign cryptographic migration',
  },
  {
    value: 99.4,
    decimals: 1,
    suffix: '%',
    label: 'Harvest-now-decrypt-later exposure reduction with hybrid PQC inspection',
  },
];

export const THREAT_CARDS: ThreatCardItem[] = [
  {
    id: 'healthcare-breaches',
    title: 'Healthcare Data Breaches',
    metricValue: 42,
    metricSuffix: '%',
    metricLabel: 'EMR encryption exposure',
    description:
      'Hospital patient databases, telemedicine streams, and digital prescription archives require multi-decade privacy protection beyond RSA-2048 lifespans.',
    sectorTag: 'Clinical Infrastructure',
  },
  {
    id: 'microfinance-risks',
    title: 'Microfinance Cyber Risks',
    metricValue: 68,
    metricSuffix: 'M+',
    metricLabel: 'Protected borrower ledgers',
    description:
      'High-frequency loan disbursements, mobile wallet bridges, and rural agent networks face automated credential attacks and future key-breaking risks.',
    sectorTag: 'Financial Inclusion',
  },
  {
    id: 'government-vulnerabilities',
    title: 'Government Service Vulnerabilities',
    metricValue: 190,
    metricSuffix: '+',
    metricLabel: 'Citizen service endpoints',
    description:
      'National citizen portals, civil registries, and inter-agency data exchanges must guarantee uninterrupted public trust and sovereign cryptographic resilience.',
    sectorTag: 'Digital Governance',
  },
  {
    id: 'education-gaps',
    title: 'Educational Platform Security Gaps',
    metricValue: 3.8,
    metricSuffix: 'M',
    metricLabel: 'Student & academic records',
    description:
      'University portals, digital learning hubs, and verifiable academic credentials are increasingly targeted by ransomware and tampering campaigns.',
    sectorTag: 'Higher Education',
  },
  {
    id: 'industrial-exposure',
    title: 'Industrial Infrastructure Exposure',
    metricValue: 46,
    metricSuffix: '%',
    metricLabel: 'OT / SCADA legacy ratio',
    description:
      'Smart factories, apparel export hubs, smart agriculture sensors, and energy networks run long-lifecycle operational hardware with weak authentication.',
    sectorTag: 'Smart Industry & AgriTech',
  },
  {
    id: 'quantum-threats',
    title: 'Future Quantum Computing Threats',
    metricValue: 2030,
    metricSuffix: '',
    metricLabel: 'Target PQC compliance horizon',
    description:
      'Harvest-now-decrypt-later adversaries capture encrypted traffic today to decrypt sovereign and institutional secrets once fault-tolerant quantum machines mature.',
    sectorTag: 'Cryptographic Horizon',
  },
];

export interface WorkflowStage {
  step: string;
  title: string;
  summary: string;
  detail: string;
  metric: string;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    step: '01',
    title: 'Infrastructure Assessment',
    summary: 'Non-intrusive discovery across cloud APIs, identity providers, and on-premise gateways.',
    detail:
      'Automated telemetry sensors map TLS handshakes, certificate chains, SAML/OIDC identity bridges, and operational technology endpoints across Dhaka and regional branches.',
    metric: 'Zero-downtime discovery',
  },
  {
    step: '02',
    title: 'Quantum Risk Detection',
    summary: 'Pinpoint RSA, ECC, and SHA-1 dependencies exposed to quantum decryption attacks.',
    detail:
      'Deep cryptographic inspection isolates deprecated key-exchange algorithms, long-lived archival encryption keys, and unauthenticated microservice links.',
    metric: 'FIPS 203 / 204 inventory',
  },
  {
    step: '03',
    title: 'AI Analysis',
    summary: 'Context-aware risk prioritization powered by our sovereign cybersecurity reasoning model.',
    detail:
      'Correlates cryptographic weakness with data sensitivity—ranking patient records, financial settlements, and SCADA controls by real operational blast radius.',
    metric: '1.8s threat triage',
  },
  {
    step: '04',
    title: 'Readiness Scoring',
    summary: 'Compute an executive-ready Quantum Readiness Score™ across every department.',
    detail:
      'Generates transparent 0–100 preparedness benchmarks by institution, sector, and subsidiary so leadership teams can track measurable security progress.',
    metric: '78/100 National Baseline',
  },
  {
    step: '05',
    title: 'Risk Mitigation Recommendations',
    summary: 'Step-by-step ML-KEM and ML-DSA migration playbooks tailored to each stack.',
    detail:
      'Produces concrete configuration patches, hybrid TLS wrapper blueprints, and phased certificate rotation schedules tailored to existing infrastructure.',
    metric: 'Actionable PQC blueprints',
  },
  {
    step: '06',
    title: 'Continuous Monitoring',
    summary: '24/7 posture drift alerts and national threat index synchronization.',
    detail:
      'Continuously watches newly deployed endpoints, vendor integrations, and anomalous traffic so quantum readiness never regresses after updates.',
    metric: '24/7 real-time posture',
  },
];

export interface CoreFeatureItem {
  id: string;
  title: string;
  description: string;
  capabilityDetail: string;
  spanWide?: boolean;
}

export const CORE_FEATURES: CoreFeatureItem[] = [
  {
    id: 'quantum-risk-scanner',
    title: 'Quantum Risk Scanner',
    description: 'Analyze digital infrastructure and identify future quantum vulnerabilities.',
    capabilityDetail:
      'Inspects TLS certificates, API gateways, database encryption envelopes, and legacy identity tokens to surface post-quantum exposure points automatically.',
    spanWide: true,
  },
  {
    id: 'quantum-readiness-score',
    title: 'Quantum Readiness Score™',
    description: 'Measure preparedness using a proprietary readiness index.',
    capabilityDetail:
      'Synthesizes cryptographic agility, authentication strength, and key rotation hygiene into an auditable 0–100 institutional score.',
  },
  {
    id: 'ai-security-copilot',
    title: 'AI Security Copilot',
    description: 'Ask questions and receive intelligent cybersecurity guidance.',
    capabilityDetail:
      'Translates complex cryptographic telemetry into clear remediation priorities for CISOs, IT directors, and compliance regulators.',
  },
  {
    id: 'critical-infrastructure-monitoring',
    title: 'Critical Infrastructure Monitoring',
    description: 'Real-time visibility into security health and infrastructure exposure.',
    capabilityDetail:
      'Continuous heartbeat telemetry across hospitals, microfinance branches, smart factories, agricultural IoT networks, and ministry gateways.',
    spanWide: true,
  },
  {
    id: 'threat-intelligence-dashboard',
    title: 'Threat Intelligence Dashboard',
    description: 'Monitor vulnerabilities and risk status in one unified platform.',
    capabilityDetail:
      'Executive command console uniting sector risk indices, endpoint inventory, and exposure velocity graphs.',
  },
  {
    id: 'migration-recommendations',
    title: 'Migration Recommendations',
    description: 'Receive AI-generated security improvement strategies.',
    capabilityDetail:
      'Actionable rollout sequences prioritizing hybrid ML-KEM key exchange and ML-DSA digital signatures without disrupting production uptime.',
  },
];

export interface PlatformModule {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  readinessScore: number;
  summary: string;
  protects: string[];
  features: string[];
  deploymentHighlight: string;
}

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: 'healthsecure',
    name: 'QuantumShield HealthSecure',
    shortName: 'HealthSecure',
    sector: 'Healthcare Institutions',
    readinessScore: 74,
    summary:
      'Safeguards clinical networks, diagnostic portals, and multi-decade patient health records against quantum-era decryption and unauthorized access.',
    protects: [
      'Hospital Records',
      'Patient Data',
      'Telemedicine Systems',
      'Healthcare Portals',
      'Digital Prescriptions',
    ],
    features: [
      'Vulnerability Assessment',
      'Data Protection Analysis',
      'Healthcare Security Monitoring',
    ],
    deploymentHighlight: 'Zero-downtime EMR encryption audit across regional hospital clusters.',
  },
  {
    id: 'microfinance',
    name: 'QuantumShield MicroFinance',
    shortName: 'MicroFinance',
    sector: 'Microfinance & Digital Banking',
    readinessScore: 81,
    summary:
      'Protects high-volume rural and urban financial inclusion networks, safeguarding borrower trust and digital disbursement rails.',
    protects: [
      'Loan Systems',
      'Digital Payments',
      'Customer Data',
      'Microfinance Platforms',
    ],
    features: [
      'Loan Security Scanning',
      'Payment Risk Analysis',
      'Customer Data Protection',
      'Fraud Risk Detection',
      'Quantum Readiness Score',
    ],
    deploymentHighlight: 'Monitors branch settlement APIs and mobile wallet bridges at millisecond latency.',
  },
  {
    id: 'edusecure',
    name: 'QuantumShield EduSecure',
    shortName: 'EduSecure',
    sector: 'Universities & EdTech',
    readinessScore: 76,
    summary:
      'Secures academic institutions, national exam registries, and remote learning infrastructure against data tampering and credential theft.',
    protects: [
      'Student Information',
      'Academic Records',
      'Digital Learning Platforms',
      'Certificates',
    ],
    features: [
      'Academic Data Security',
      'Student Privacy Protection',
      'Credential Verification',
    ],
    deploymentHighlight: 'Post-quantum signature attestation for university transcripts and degree registries.',
  },
  {
    id: 'industrial',
    name: 'QuantumShield Industrial',
    shortName: 'Industrial',
    sector: 'Smart Factories, AgriTech & Energy',
    readinessScore: 71,
    summary:
      'Defends smart manufacturing plants, export logistics, smart agriculture sensor grids, and national energy telemetry.',
    protects: [
      'Smart Factories',
      'Industrial IoT',
      'Manufacturing Networks',
      'Energy Infrastructure',
    ],
    features: [
      'Infrastructure Assessment',
      'Factory Security Analysis',
      'Operational Technology Monitoring',
    ],
    deploymentHighlight: 'Edge gateway hardening for SCADA controllers and automated assembly telemetry.',
  },
  {
    id: 'govsecure',
    name: 'QuantumShield GovSecure',
    shortName: 'GovSecure',
    sector: 'Government & Public Infrastructure',
    readinessScore: 83,
    summary:
      'Reinforces citizen-facing e-governance services, civil identity infrastructure, and inter-ministry communication backbones.',
    protects: [
      'Citizen Portals',
      'E-Government Services',
      'Public Infrastructure',
      'National Digital Services',
    ],
    features: [
      'Citizen Data Protection',
      'Government Security Monitoring',
      'Infrastructure Trust Analysis',
    ],
    deploymentHighlight: 'Sovereign compliance telemetry aligned with national cyber resilience directives.',
  },
];

export const NATIONAL_EXPOSURE_SERIES: Record<
  TimeframeId,
  {
    label: string;
    points: { period: string; exposure: number; readiness: number }[];
  }
> = {
  '30d': {
    label: 'Last 30 Days',
    points: [
      { period: 'Day 01', exposure: 46, readiness: 69 },
      { period: 'Day 06', exposure: 44, readiness: 71 },
      { period: 'Day 12', exposure: 41, readiness: 73 },
      { period: 'Day 18', exposure: 38, readiness: 75 },
      { period: 'Day 24', exposure: 36, readiness: 77 },
      { period: 'Day 30', exposure: 34, readiness: 78 },
    ],
  },
  '90d': {
    label: 'Last 90 Days',
    points: [
      { period: 'Wk 01', exposure: 54, readiness: 61 },
      { period: 'Wk 03', exposure: 50, readiness: 64 },
      { period: 'Wk 06', exposure: 45, readiness: 68 },
      { period: 'Wk 09', exposure: 40, readiness: 73 },
      { period: 'Wk 11', exposure: 36, readiness: 76 },
      { period: 'Wk 13', exposure: 34, readiness: 78 },
    ],
  },
  '1y': {
    label: '12-Month Trajectory',
    points: [
      { period: 'Q1', exposure: 64, readiness: 49 },
      { period: 'Q2', exposure: 56, readiness: 58 },
      { period: 'Q3', exposure: 47, readiness: 66 },
      { period: 'Q4', exposure: 41, readiness: 72 },
      { period: 'Jan', exposure: 37, readiness: 75 },
      { period: 'Now', exposure: 34, readiness: 78 },
    ],
  },
};

export const THREAT_NODE_RECORDS: ThreatNodeRecord[] = [
  {
    id: 'qs-bd-01',
    institution: 'Dhaka Central Telemedicine Grid',
    sector: 'healthcare',
    region: 'Dhaka Division',
    protocol: 'TLS 1.3 + Hybrid ML-KEM',
    readinessScore: 76,
    riskIndex: 38,
    status: 'Transitioning',
  },
  {
    id: 'qs-bd-02',
    institution: 'Padma MicroCredit Core Network',
    sector: 'microfinance',
    region: 'Rajshahi & Khulna',
    protocol: 'Mutual TLS + ML-DSA',
    readinessScore: 84,
    riskIndex: 28,
    status: 'Quantum-Ready',
  },
  {
    id: 'qs-bd-03',
    institution: 'National Citizen Service Portal',
    sector: 'government',
    region: 'Dhaka Sovereign Cloud',
    protocol: 'ML-KEM-1024 + AES-256',
    readinessScore: 87,
    riskIndex: 23,
    status: 'Quantum-Ready',
  },
  {
    id: 'qs-bd-04',
    institution: 'Chattogram Smart Export Zone SCADA',
    sector: 'industry',
    region: 'Chattogram',
    protocol: 'RSA-2048 Legacy Bridge',
    readinessScore: 66,
    riskIndex: 49,
    status: 'Action Required',
  },
  {
    id: 'qs-bd-05',
    institution: 'National University Credential Hub',
    sector: 'education',
    region: 'Gazipur',
    protocol: 'ECDSA P-256 + Hybrid Token',
    readinessScore: 77,
    riskIndex: 35,
    status: 'Transitioning',
  },
  {
    id: 'qs-bd-06',
    institution: 'Sylhet Smart Agriculture Telemetry',
    sector: 'industry',
    region: 'Sylhet',
    protocol: 'TLS 1.2 + Legacy IoT Certs',
    readinessScore: 72,
    riskIndex: 43,
    status: 'Action Required',
  },
];

export interface PricingTier {
  id: PricingTierId;
  name: string;
  audience: string;
  summary: string;
  highlighted?: boolean;
  limits: { label: string; value: string }[];
  ctaLabel: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    audience: 'For Universities and SMEs',
    summary:
      'Rapid quantum vulnerability scanning and readiness scoring for academic portals, research hubs, and growing technology teams.',
    limits: [
      { label: 'Monitored Assets', value: 'Up to 25 endpoints' },
      { label: 'Readiness Index', value: 'Monthly Quantum Readiness Score™' },
      { label: 'AI Copilot Queries', value: '500 guided analyses / mo' },
      { label: 'Deployment', value: 'Cloud SaaS · 48h onboarding' },
    ],
    ctaLabel: 'Start with Starter',
  },
  {
    id: 'professional',
    name: 'Professional',
    audience: 'For Microfinance Institutions and Hospitals',
    summary:
      'Continuous real-time infrastructure monitoring, automated AI risk triage, and sector-specific PQC migration playbooks.',
    highlighted: true,
    limits: [
      { label: 'Monitored Assets', value: 'Up to 250 endpoints' },
      { label: 'Readiness Index', value: 'Continuous live Readiness Score™' },
      { label: 'AI Copilot Queries', value: 'Unlimited + remediation scripts' },
      { label: 'Compliance & SLA', value: 'HealthSecure / MicroFinance modules' },
    ],
    ctaLabel: 'Choose Professional',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'For Government and National Infrastructure',
    summary:
      'Sovereign-grade deployment covering ministries, power & industrial SCADA grids, and multi-division national command centers.',
    limits: [
      { label: 'Monitored Assets', value: 'Unlimited national nodes' },
      { label: 'Readiness Index', value: 'National Threat Dashboard federation' },
      { label: 'AI Copilot Queries', value: 'Dedicated air-gapped LLM option' },
      { label: 'Compliance & SLA', value: '24/7 Dhaka SOC · 99.99% uptime' },
    ],
    ctaLabel: 'Contact Sovereign Sales',
  },
];

export const SOCIAL_IMPACT_AREAS = [
  {
    title: 'Critical Infrastructure Security',
    detail: 'Hardens power grids, telecom backbones, and national data corridors ahead of quantum decryption.',
  },
  {
    title: 'Secure Healthcare Systems',
    detail: 'Protects millions of long-lived hospital records, telemedicine consultations, and digital prescriptions.',
  },
  {
    title: 'Secure Financial Services',
    detail: 'Strengthens microfinance disbursement rails, borrower KYC data, and mobile payment ecosystems.',
  },
  {
    title: 'Digital Governance Protection',
    detail: 'Secures citizen identity portals and public digital services so civic trust remains unbroken.',
  },
  {
    title: 'National Cyber Resilience',
    detail: 'Establishes unified sector-wide visibility to detect and neutralize systemic cryptographic risk early.',
  },
  {
    title: 'Secure Digital Economy',
    detail: 'Equips Bangladeshi export industries, fintechs, and SMEs to meet global post-quantum security standards.',
  },
  {
    title: 'Innovation-Driven Cybersecurity Ecosystem',
    detail: 'Cultivates sovereign post-quantum engineering talent across universities, startups, and security centers.',
  },
];

export interface SdgCardItem {
  number: string;
  tier: 'Primary SDG' | 'Secondary SDG';
  title: string;
  focus: string;
  impactMetric: string;
  accentHex: string;
}

export const SDG_ALIGNMENTS: SdgCardItem[] = [
  {
    number: 'SDG 9',
    tier: 'Primary SDG',
    title: 'Industry, Innovation and Infrastructure',
    focus:
      'Upgrades Bangladesh’s hospitals, smart factories, smart agriculture networks, and digital public infrastructure with resilient post-quantum security architecture.',
    impactMetric: 'Target 9.1 & 9.c · Resilient digital & industrial infrastructure',
    accentHex: '#00FFFF',
  },
  {
    number: 'SDG 8',
    tier: 'Secondary SDG',
    title: 'Decent Work and Economic Growth',
    focus:
      'Safeguards microfinance institutions, digital payments, and export-oriented manufacturing networks so inclusive economic growth thrives safely online.',
    impactMetric: 'Target 8.10 · Safe digital financial services for all',
    accentHex: '#2D7FF9',
  },
  {
    number: 'SDG 16',
    tier: 'Secondary SDG',
    title: 'Peace, Justice and Strong Institutions',
    focus:
      'Protects e-government portals, citizen registries, and educational credentials to uphold transparent, accountable, tamper-resistant public institutions.',
    impactMetric: 'Target 16.6 · Effective, accountable & transparent institutions',
    accentHex: '#7C3AED',
  },
];

export const WHY_QUANTUMSHIELD_CARDS = [
  {
    title: 'AI Powered',
    detail: 'Continuous vulnerability reasoning and plain-language remediation via the AI Security Copilot.',
  },
  {
    title: 'Future Ready',
    detail: 'Engineered around NIST post-quantum standards (ML-KEM & ML-DSA) for seamless cryptographic agility.',
  },
  {
    title: 'National Impact',
    detail: "Built purposefully as Bangladesh's first AI-powered Quantum Readiness & Critical Infrastructure Platform.",
  },
  {
    title: 'Scalable SaaS Platform',
    detail: 'Onboards a university in 48 hours or scales across nationwide ministry infrastructure.',
  },
  {
    title: 'Enterprise Grade',
    detail: 'Zero-trust architecture, role-based audit trails, and sovereign cloud or on-premise deployment.',
  },
  {
    title: 'Quantum-Focused Security',
    detail: 'Purpose-built to defeat harvest-now-decrypt-later collection before fault-tolerant quantum attacks arrive.',
  },
  {
    title: 'Critical Infrastructure Protection',
    detail: 'Dedicated telemetry modules for Healthcare, Microfinance, Education, Industrial OT, and Government.',
  },
  {
    title: 'Strong Business Model',
    detail: 'Predictable recurring SaaS tiers spanning universities, microfinance institutions, and sovereign contracts.',
  },
];
