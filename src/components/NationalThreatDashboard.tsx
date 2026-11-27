import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Globe,
  ShieldCheck,
  Mail,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  NATIONAL_EXPOSURE_SERIES,
  THREAT_NODE_RECORDS,
} from '../data/quantumPlatformData';
import {
  buildThreatNodesCsv,
  filterThreatNodes,
  safeStorageGet,
  safeStorageSet,
  sortThreatNodes,
  type SectorId,
  type SortDirection,
  type ThreatNodeRecord,
  type ThreatSortKey,
  type TimeframeId,
} from '../utils/quantumReadiness';
import { clampBlueprintString, type LiveTlsTelemetry } from '../utils/securityScanner';
import { triggerBrowserDownload } from '../utils/browserExport';
import { CountUpNumber } from './CountUpNumber';
import type { LiveScanContextItem } from './AiCopilotSection';

const TIMEFRAME_STORAGE_KEY = 'qs_threat_timeframe_v1';

interface LiveThreatNode extends ThreatNodeRecord {
  isLive?: boolean;
  remediationApplied?: boolean;
  aiSummary?: string;
  recommendedSteps?: string[];
  telemetry?: LiveTlsTelemetry;
}

interface NationalThreatDashboardProps {
  onScansChange?: (scans: LiveScanContextItem[]) => void;
}

const INDEX_METRICS = [
  {
    label: 'Healthcare Risk Index',
    value: 42,
    suffix: '/100',
    delta: '-6% 30d risk',
    tone: 'text-amber-300',
  },
  {
    label: 'Microfinance Risk Index',
    value: 31,
    suffix: '/100',
    delta: '-11% 30d risk',
    tone: 'text-[#00FFFF]',
  },
  {
    label: 'Government Readiness',
    value: 83,
    suffix: '/100',
    delta: '+9% 30d readiness',
    tone: 'text-emerald-400',
  },
  {
    label: 'Industry Security Score',
    value: 71,
    suffix: '/100',
    delta: '+5% 30d readiness',
    tone: 'text-[#2D7FF9]',
  },
];

const SECTOR_FILTERS: { id: 'all' | Exclude<SectorId, 'national'>; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'microfinance', label: 'Microfinance' },
  { id: 'government', label: 'Government' },
  { id: 'education', label: 'Education' },
  { id: 'industry', label: 'Industry' },
];

export function NationalThreatDashboard({ onScansChange }: NationalThreatDashboardProps) {
  const { user, authReady } = useFirebase();
  const [timeframe, setTimeframe] = useState<TimeframeId>(() => {
    const saved = safeStorageGet<TimeframeId>(TIMEFRAME_STORAGE_KEY, '90d');
    return saved === '30d' || saved === '90d' || saved === '1y' ? saved : '90d';
  });
  const [sectorFilter, setSectorFilter] = useState<'all' | Exclude<SectorId, 'national'>>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ThreatSortKey>('readinessScore');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Live scanner state
  const [scanTargetInput, setScanTargetInput] = useState('');
  const [scanSector, setScanSector] = useState<Exclude<SectorId, 'national'>>('government');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [liveScans, setLiveScans] = useState<LiveThreatNode[]>([]);

  // Remediation & Alert email state
  const [isApplyingRemediation, setIsApplyingRemediation] = useState(false);
  const [remediationNotice, setRemediationNotice] = useState<string | null>(null);
  const [alertEmail, setAlertEmail] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<{
    status: 'sent' | 'not_configured' | 'failed';
    detail: string;
  } | null>(null);

  useEffect(() => {
    safeStorageSet(TIMEFRAME_STORAGE_KEY, timeframe);
  }, [timeframe]);

  // Subscribe to user's Firestore scans when signed in
  useEffect(() => {
    if (!authReady || !user) return;

    const q = query(collection(db, 'scans'), where('ownerUid', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: LiveThreatNode[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id || docSnap.id),
            institution: String(d.targetHost || 'Unknown Host'),
            sector: (d.sector as Exclude<SectorId, 'national'>) || 'government',
            region: String(d.region || 'Cloud Probe'),
            protocol: String(d.protocol || 'TLS'),
            readinessScore: Number(d.readinessScore ?? 0),
            riskIndex: Number(d.riskIndex ?? 0),
            status:
              d.status === 'Quantum-Ready' || d.status === 'Action Required'
                ? d.status
                : 'Transitioning',
            isLive: true,
            remediationApplied: Boolean(d.remediationApplied),
            aiSummary: typeof d.aiSummary === 'string' ? d.aiSummary : undefined,
            recommendedSteps: Array.isArray(d.recommendedSteps) ? d.recommendedSteps : [],
          };
        });
        setLiveScans((prev) => {
          const telemetryMap = new Map(prev.map((n) => [n.id, n.telemetry]));
          return docs.map((d) => ({
            ...d,
            telemetry: telemetryMap.get(d.id),
          }));
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'scans');
      }
    );
    return () => unsub();
  }, [authReady, user]);

  // Share live scan context with AI Security Copilot
  useEffect(() => {
    if (!onScansChange) return;
    onScansChange(
      liveScans.map((s) => ({
        targetHost: s.institution,
        protocol: s.protocol,
        readinessScore: s.readinessScore,
        status: s.status,
      }))
    );
  }, [liveScans, onScansChange]);

  const combinedNodes = useMemo<LiveThreatNode[]>(() => {
    const liveIds = new Set(liveScans.map((s) => s.id));
    return [...liveScans, ...THREAT_NODE_RECORDS.filter((r) => !liveIds.has(r.id))];
  }, [liveScans]);

  const series = NATIONAL_EXPOSURE_SERIES[timeframe];
  const filteredNodes = useMemo(
    () => filterThreatNodes(combinedNodes, sectorFilter, searchQuery) as LiveThreatNode[],
    [combinedNodes, sectorFilter, searchQuery]
  );
  const sortedNodes = useMemo(
    () => sortThreatNodes(filteredNodes, sortKey, sortDir) as LiveThreatNode[],
    [filteredNodes, sortKey, sortDir]
  );

  const selectedNode = useMemo(
    () => combinedNodes.find((n) => n.id === selectedNodeId) ?? null,
    [combinedNodes, selectedNodeId]
  );

  const handleSort = (key: ThreatSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'institution' ? 'asc' : 'desc');
    }
  };

  const handleExportCsv = () => {
    const csv = buildThreatNodesCsv(sortedNodes);
    triggerBrowserDownload(
      `quantumshield-threat-nodes-${sectorFilter}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
  };

  const handleLiveScan = async (e: FormEvent) => {
    e.preventDefault();
    const target = scanTargetInput.trim();
    if (!target || isScanning) return;

    setScanError(null);
    setRemediationNotice(null);
    setAlertFeedback(null);
    setIsScanning(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: target,
          sector: scanSector,
          region: 'Live TLS Probe',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Scan failed with HTTP ${response.status}`);
      }

      const newNode: LiveThreatNode = {
        id: String(data.id),
        institution: String(data.targetHost),
        sector: (data.sector as Exclude<SectorId, 'national'>) || scanSector,
        region: String(data.region || 'Live TLS Probe'),
        protocol: String(data.protocol || 'TLS'),
        readinessScore: Number(data.readinessScore ?? 65),
        riskIndex: Number(data.riskIndex ?? 35),
        status:
          data.status === 'Quantum-Ready' || data.status === 'Action Required'
            ? data.status
            : 'Transitioning',
        isLive: true,
        remediationApplied: Boolean(data.remediationApplied),
        aiSummary: String(data.aiSummary || 'Live inspection completed.'),
        recommendedSteps: Array.isArray(data.recommendedSteps) ? data.recommendedSteps : [],
        telemetry: data.telemetry,
      };

      setLiveScans((prev) => [newNode, ...prev.filter((item) => item.id !== newNode.id)]);
      setSectorFilter('all');
      setSearchQuery('');
      setSelectedNodeId(newNode.id);
      setScanTargetInput('');

      if (user && user.emailVerified) {
        const docPath = `scans/${newNode.id}`;
        try {
          await setDoc(doc(db, 'scans', newNode.id), {
            id: newNode.id,
            ownerUid: user.uid,
            targetHost: clampBlueprintString(newNode.institution, 253),
            sector: newNode.sector,
            region: clampBlueprintString(newNode.region, 80),
            protocol: clampBlueprintString(newNode.protocol, 140),
            readinessScore: Math.max(0, Math.min(100, Math.round(newNode.readinessScore))),
            riskIndex: Math.max(0, Math.min(100, Math.round(newNode.riskIndex))),
            status: newNode.status,
            remediationApplied: false,
            aiSummary: clampBlueprintString(
              newNode.aiSummary || 'Live TLS inspection complete.',
              2000
            ),
            recommendedSteps: (newNode.recommendedSteps || [])
              .slice(0, 10)
              .map((s) => clampBlueprintString(String(s), 400)),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.CREATE, docPath);
        }
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to complete live target scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyRemediation = async (node: LiveThreatNode) => {
    if (isApplyingRemediation || node.status === 'Quantum-Ready') return;
    setIsApplyingRemediation(true);
    setRemediationNotice(null);

    const nextScore = Math.min(98, Math.max(85, node.readinessScore + 16));
    const nextRisk = Math.max(10, node.riskIndex - 18);

    try {
      setLiveScans((prev) =>
        prev.map((item) =>
          item.id === node.id
            ? {
                ...item,
                remediationApplied: true,
                readinessScore: nextScore,
                riskIndex: nextRisk,
                status: 'Quantum-Ready',
              }
            : item
        )
      );

      if (node.isLive && user && user.emailVerified) {
        const docPath = `scans/${node.id}`;
        try {
          await updateDoc(doc(db, 'scans', node.id), {
            remediationApplied: true,
            readinessScore: nextScore,
            riskIndex: nextRisk,
            status: 'Quantum-Ready',
            updatedAt: serverTimestamp(),
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.UPDATE, docPath);
        }
      }

      setRemediationNotice(
        `PQC hybrid remediation applied to ${node.institution}: Readiness upgraded to ${nextScore}/100.`
      );
    } finally {
      setIsApplyingRemediation(false);
    }
  };

  const handleSendAlertEmail = async (e: FormEvent, node: LiveThreatNode) => {
    e.preventDefault();
    const recipient = alertEmail.trim();
    if (!recipient || isSendingAlert) return;

    setIsSendingAlert(true);
    setAlertFeedback(null);

    try {
      const response = await fetch('/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipient,
          targetHost: node.institution,
          readinessScore: node.readinessScore,
          riskIndex: node.riskIndex,
          status: node.status,
          aiSummary:
            node.aiSummary ||
            `Cryptographic posture alert for ${node.institution} (${node.protocol}).`,
          recommendedSteps:
            node.recommendedSteps && node.recommendedSteps.length > 0
              ? node.recommendedSteps
              : ['Deploy hybrid ML-KEM-768 edge termination and rotate legacy certificates.'],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Could not dispatch alert email.');
      }

      setAlertFeedback({
        status: data.emailStatus || 'not_configured',
        detail: String(data.emailDetail || 'Alert processed.'),
      });
    } catch (err) {
      setAlertFeedback({
        status: 'failed',
        detail: err instanceof Error ? err.message : 'Alert dispatch failed.',
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  const renderSortIcon = (key: ThreatSortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3 w-3 text-slate-500" aria-hidden="true" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#00FFFF]" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#00FFFF]" aria-hidden="true" />
    );
  };

  // SVG chart coordinates (680x210 viewBox)
  const chartW = 680;
  const chartH = 210;
  const padX = 40;
  const padY = 24;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  const points = series.points.map((pt, i) => {
    const x = padX + (i / (series.points.length - 1)) * innerW;
    const yExposure = padY + (1 - pt.exposure / 100) * innerH;
    const yReadiness = padY + (1 - pt.readiness / 100) * innerH;
    return { ...pt, x, yExposure, yReadiness };
  });

  const exposurePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yExposure}`)
    .join(' ');
  const readinessPath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yReadiness}`)
    .join(' ');
  const readinessArea = `${readinessPath} L ${points[points.length - 1].x} ${chartH - padY} L ${points[0].x} ${chartH - padY} Z`;

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <section
      id="threat-dashboard"
      className="relative border-b border-slate-800/80 bg-[#060913] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              National Quantum Threat Dashboard
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
              Real-Time National Exposure &amp; Live Defense Telemetry
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Inspect live TLS handshakes and security headers on real domains, score post-quantum
              exposure via Gemini AI, track remediation, and dispatch security alerts.
            </p>
          </div>
          <p className="font-mono text-xs text-slate-400">
            Telemetry Scope: Live Probes · Dhaka · Chattogram · Rajshahi · Sylhet
          </p>
        </div>

        {/* 4 Top KPI Indices */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDEX_METRICS.map((kpi) => (
            <div key={kpi.label} className="glass-surface rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-400">{kpi.label}</p>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <p className={`font-mono text-3xl font-bold tabular-nums ${kpi.tone}`}>
                  <CountUpNumber value={kpi.value} suffix={kpi.suffix} />
                </p>
                <span className="font-mono text-xs text-slate-300 tabular-nums">
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Interactive Trend Chart */}
        <div className="glass-surface-elevated mt-6 rounded-2xl p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                National Quantum Exposure Trend
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {series.label} · Exposure Index vs. Quantum Readiness Score™
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-4 text-xs sm:flex">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#00FFFF]" />
                  Readiness Score
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#7C3AED]" />
                  Quantum Exposure
                </span>
              </div>

              <div
                role="group"
                aria-label="Select trend timeframe"
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1"
              >
                {(['30d', '90d', '1y'] as TimeframeId[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    aria-pressed={timeframe === tf}
                    onClick={() => {
                      setTimeframe(tf);
                      setHoveredIdx(null);
                    }}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold uppercase transition-colors cursor-pointer ${
                      timeframe === tf
                        ? 'bg-[#2D7FF9] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive SVG Chart */}
          <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-9">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="h-56 w-full overflow-visible"
                role="img"
                aria-label="National Quantum Exposure Trend chart"
              >
                <defs>
                  <linearGradient id="readinessFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0, 255, 255, 0.25)" />
                    <stop offset="100%" stopColor="rgba(0, 255, 255, 0.0)" />
                  </linearGradient>
                </defs>

                {[25, 50, 75].map((gridVal) => {
                  const y = padY + (1 - gridVal / 100) * innerH;
                  return (
                    <g key={gridVal}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="rgba(148,163,184,0.12)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padX - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-500 font-mono text-[10px]"
                      >
                        {gridVal}
                      </text>
                    </g>
                  );
                })}

                <path d={readinessArea} fill="url(#readinessFill)" />
                <path
                  d={readinessPath}
                  fill="none"
                  stroke="#00FFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={exposurePath}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />

                {points.map((pt, idx) => (
                  <g
                    key={pt.period}
                    role="button"
                    tabIndex={0}
                    aria-label={`${pt.period}: Readiness ${pt.readiness}/100, Exposure ${pt.exposure}/100`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onFocus={() => setHoveredIdx(idx)}
                    onClick={() => setHoveredIdx(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setHoveredIdx(idx);
                      }
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    <circle cx={pt.x} cy={chartH / 2} r={18} fill="transparent" />
                    <circle
                      cx={pt.x}
                      cy={pt.yReadiness}
                      r={hoveredIdx === idx ? 5.5 : 4}
                      fill="#00FFFF"
                      stroke="#05070E"
                      strokeWidth="2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.yExposure}
                      r={hoveredIdx === idx ? 5.5 : 4}
                      fill="#7C3AED"
                      stroke="#05070E"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={chartH - 4}
                      textAnchor="middle"
                      className="fill-slate-400 font-mono text-[11px]"
                    >
                      {pt.period}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Active Data Point Summary */}
            <div className="space-y-4 border-t border-slate-800 pt-4 lg:col-span-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              <div>
                <p className="text-xs text-slate-400">Selected Interval</p>
                <p className="font-display text-lg font-semibold text-white">
                  {activePoint.period}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Readiness Score</p>
                <p className="font-mono text-2xl font-bold text-[#00FFFF] tabular-nums">
                  {activePoint.readiness}/100
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Exposure Index</p>
                <p className="font-mono text-2xl font-bold text-[#A78BFA] tabular-nums">
                  {activePoint.exposure}/100
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Target Scanner + Monitored Infrastructure Nodes */}
        <div className="glass-surface mt-6 rounded-2xl p-6">
          {/* Live Infrastructure Probe Form */}
          <form
            onSubmit={(e) => void handleLiveScan(e)}
            className="mb-6 rounded-xl border border-cyan-500/25 bg-slate-950/75 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2 lg:w-64 shrink-0">
                <Globe className="h-4 w-4 text-[#00FFFF] shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-display text-xs font-semibold text-white">
                    Live Cryptographic Probe
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Inspect real TLS &amp; HTTP posture
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 sm:flex-row">
                <label htmlFor="live-scan-target" className="sr-only">
                  Domain or HTTPS URL to scan
                </label>
                <input
                  id="live-scan-target"
                  type="text"
                  value={scanTargetInput}
                  onChange={(e) => setScanTargetInput(e.target.value)}
                  placeholder="Enter public domain (e.g., cloudflare.com or portal.gov.bd)"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                />

                <label htmlFor="live-scan-sector" className="sr-only">
                  Infrastructure sector
                </label>
                <select
                  id="live-scan-sector"
                  value={scanSector}
                  onChange={(e) =>
                    setScanSector(e.target.value as Exclude<SectorId, 'national'>)
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-[#00FFFF] focus:outline-none"
                >
                  <option value="government">Government</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="microfinance">Microfinance</option>
                  <option value="education">Education</option>
                  <option value="industry">Industry</option>
                </select>

                <button
                  type="submit"
                  disabled={isScanning || scanTargetInput.trim().length === 0}
                  data-testid="live-scan-submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#06B6D4] to-[#2D7FF9] px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      <span>Probing TLS...</span>
                    </>
                  ) : (
                    <span>Scan Live Target</span>
                  )}
                </button>
              </div>
            </div>

            {scanError && (
              <div
                role="alert"
                data-testid="live-scan-error"
                className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{scanError}</span>
              </div>
            )}
          </form>

          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 xl:flex-row xl:items-center">
            <div>
              <h3 className="font-display text-base font-semibold text-white">
                Monitored National Infrastructure Nodes
              </h3>
              <p className="text-xs text-slate-400">
                Filter by sector, sort metrics, or click any row for remediation &amp; alert dispatch
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
                {SECTOR_FILTERS.map((sf) => (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => setSectorFilter(sf.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      sectorFilter === sf.id
                        ? 'bg-[#2D7FF9] text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <label htmlFor="node-search" className="sr-only">
                  Search monitored nodes
                </label>
                <input
                  id="node-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search institution or city..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pr-3 pl-8 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none sm:w-52"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={sortedNodes.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </button>
            </div>
          </div>

          {sortedNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-slate-300">
                No infrastructure nodes match your active filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSectorFilter('all');
                  setSearchQuery('');
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-400/50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('institution')}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-[#00FFFF] cursor-pointer"
                      >
                        <span>Institution / Node</span>
                        {renderSortIcon('institution')}
                      </button>
                    </th>
                    <th className="py-2.5 pr-4 font-medium">Region</th>
                    <th className="py-2.5 pr-4 font-medium">Cryptographic Profile</th>
                    <th className="py-2.5 pr-4 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('readinessScore')}
                        className="inline-flex items-center justify-end gap-1.5 font-medium text-slate-300 hover:text-[#00FFFF] cursor-pointer"
                      >
                        <span>Readiness</span>
                        {renderSortIcon('readinessScore')}
                      </button>
                    </th>
                    <th className="py-2.5 pr-4 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('riskIndex')}
                        className="inline-flex items-center justify-end gap-1.5 font-medium text-slate-300 hover:text-[#00FFFF] cursor-pointer"
                      >
                        <span>Risk Index</span>
                        {renderSortIcon('riskIndex')}
                      </button>
                    </th>
                    <th className="py-2.5 text-right font-medium">Posture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {sortedNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <tr
                        key={node.id}
                        onClick={() => {
                          setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
                          setRemediationNotice(null);
                          setAlertFeedback(null);
                        }}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-900/45'
                        }`}
                      >
                        <td className="py-3 pr-4 font-medium text-slate-100">
                          <span className="inline-flex items-center gap-2">
                            <span>{node.institution}</span>
                            {node.isLive && (
                              <span className="font-mono text-[10px] font-semibold text-[#00FFFF]">
                                [LIVE]
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{node.region}</td>
                        <td className="py-3 pr-4 font-mono text-slate-300">{node.protocol}</td>
                        <td className="py-3 pr-4 text-right font-mono font-semibold text-[#00FFFF] tabular-nums">
                          {node.readinessScore}/100
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-slate-200 tabular-nums">
                          {node.riskIndex}
                        </td>
                        <td className="py-3 text-right font-mono">
                          <span
                            className={
                              node.status === 'Quantum-Ready'
                                ? 'text-emerald-400'
                                : node.status === 'Transitioning'
                                ? 'text-cyan-300'
                                : 'text-amber-300'
                            }
                          >
                            {node.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedNode && (
            <div
              data-testid="selected-node-detail"
              className="mt-4 space-y-4 border-t border-slate-800 pt-4"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="space-y-1.5">
                  <p className="font-mono text-xs text-cyan-300">
                    Node Telemetry · {selectedNode.id.toUpperCase()}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {selectedNode.institution} ({selectedNode.region})
                  </p>
                  <p className="text-xs leading-relaxed text-slate-300">
                    Active Stack:{' '}
                    <span className="font-mono text-slate-100">{selectedNode.protocol}</span>
                    {selectedNode.aiSummary
                      ? ` · ${selectedNode.aiSummary}`
                      : selectedNode.status === 'Action Required'
                      ? ' · Recommended Next Step: Deploy hybrid ML-KEM-768 edge proxy and rotate legacy asymmetric certificates.'
                      : selectedNode.status === 'Transitioning'
                      ? ' · Recommended Next Step: Complete dual-stack ML-DSA token signing verification across secondary gateways.'
                      : ' · Recommended Next Step: Maintain continuous cryptographic drift monitoring and quarterly key-rotation audits.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedNode.status !== 'Quantum-Ready' && (
                    <button
                      type="button"
                      disabled={isApplyingRemediation}
                      onClick={() => void handleApplyRemediation(selectedNode)}
                      data-testid="apply-remediation-btn"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {isApplyingRemediation ? 'Applying...' : 'Apply PQC Remediation'}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Close node telemetry details"
                    onClick={() => setSelectedNodeId(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white shrink-0 cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {remediationNotice && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{remediationNotice}</span>
                </div>
              )}

              {selectedNode.telemetry && (
                <div className="grid gap-3 rounded-xl border border-slate-800/90 bg-slate-950/75 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-slate-400">TLS Protocol</p>
                    <p className="mt-0.5 font-mono font-semibold text-white">
                      {selectedNode.telemetry.tlsVersion}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Certificate Issuer</p>
                    <p className="mt-0.5 font-mono text-slate-200">
                      {selectedNode.telemetry.certIssuer}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Security Headers Present</p>
                    <p className="mt-0.5 font-mono text-emerald-300">
                      {selectedNode.telemetry.headersPresent.length > 0
                        ? selectedNode.telemetry.headersPresent.join(', ')
                        : 'None detected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Missing Hardening Headers</p>
                    <p className="mt-0.5 font-mono text-amber-300">
                      {selectedNode.telemetry.headersMissing.length > 0
                        ? selectedNode.telemetry.headersMissing.join(', ')
                        : 'All checked headers active'}
                    </p>
                  </div>
                </div>
              )}

              {selectedNode.recommendedSteps && selectedNode.recommendedSteps.length > 0 && (
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 text-xs">
                  <p className="font-semibold text-cyan-300">
                    Prioritized PQC Hardening Steps
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-200">
                    {selectedNode.recommendedSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Alert Email Dispatch Form */}
              <form
                onSubmit={(e) => void handleSendAlertEmail(e, selectedNode)}
                className="flex flex-col gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2 text-xs text-slate-300 shrink-0">
                  <Mail className="h-3.5 w-3.5 text-[#00FFFF]" aria-hidden="true" />
                  <span>Dispatch Security Alert:</span>
                </div>
                <label htmlFor="node-alert-email" className="sr-only">
                  Recipient email for security alert
                </label>
                <input
                  id="node-alert-email"
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="ciso@institution.org.bd"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSendingAlert || !alertEmail.trim()}
                  data-testid="send-alert-email-btn"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-[#00FFFF] transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSendingAlert ? 'Sending...' : 'Send Alert Email'}
                </button>
              </form>

              {alertFeedback && (
                <div
                  data-testid="alert-email-feedback"
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    alertFeedback.status === 'sent'
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                      : alertFeedback.status === 'failed'
                      ? 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                      : 'border-cyan-500/30 bg-cyan-500/8 text-cyan-100'
                  }`}
                >
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{alertFeedback.detail}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
