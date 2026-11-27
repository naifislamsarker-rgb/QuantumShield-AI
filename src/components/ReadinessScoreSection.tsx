import { useEffect, useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Download, RotateCcw, Shield } from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  applySectorMitigations,
  safeStorageGet,
  safeStorageSet,
  type SectorId,
} from '../utils/quantumReadiness';
import { triggerBrowserDownload } from '../utils/browserExport';

const MITIGATION_STORAGE_KEY = 'qs_applied_mitigations_v1';

const SECTOR_TABS: { id: SectorId; label: string }[] = [
  { id: 'national', label: 'National (78)' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'microfinance', label: 'Microfinance' },
  { id: 'education', label: 'Education' },
  { id: 'government', label: 'Government' },
  { id: 'industry', label: 'Industry' },
];

const COMPARISON_SECTORS: SectorId[] = [
  'government',
  'microfinance',
  'education',
  'healthcare',
  'industry',
];

export function ReadinessScoreSection() {
  const { user, authReady } = useFirebase();
  const [selectedSector, setSelectedSector] = useState<SectorId>('national');
  const [appliedBySector, setAppliedBySector] = useState<Partial<Record<SectorId, number[]>>>(() =>
    safeStorageGet<Partial<Record<SectorId, number[]>>>(MITIGATION_STORAGE_KEY, {})
  );

  useEffect(() => {
    safeStorageSet(MITIGATION_STORAGE_KEY, appliedBySector);
  }, [appliedBySector]);

  useEffect(() => {
    if (!authReady || !user) return;
    const q = query(
      collection(db, 'mitigation_profiles'),
      where('ownerUid', '==', user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const nextMap: Partial<Record<SectorId, number[]>> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (typeof data.sectorId === 'string' && Array.isArray(data.appliedIndices)) {
            nextMap[data.sectorId as SectorId] = data.appliedIndices.filter(
              (n): n is number => Number.isInteger(n)
            );
          }
        });
        if (Object.keys(nextMap).length > 0) {
          setAppliedBySector((prev) => ({ ...prev, ...nextMap }));
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'mitigation_profiles');
      }
    );
    return () => unsub();
  }, [authReady, user]);

  const appliedIndices = appliedBySector[selectedSector] ?? [];
  const activeProfile = applySectorMitigations(selectedSector, appliedIndices);

  const persistMitigationProfile = async (sectorId: SectorId, indices: number[]) => {
    if (!user || !user.emailVerified) return;
    const docId = `${user.uid}_${sectorId}`;
    const docPath = `mitigation_profiles/${docId}`;
    try {
      await setDoc(
        doc(db, 'mitigation_profiles', docId),
        {
          ownerUid: user.uid,
          sectorId,
          appliedIndices: indices.slice(0, 10),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const toggleMitigation = (index: number) => {
    const current = appliedBySector[selectedSector] ?? [];
    const exists = current.includes(index);
    const nextIndices = exists
      ? current.filter((item) => item !== index)
      : [...current, index];
    setAppliedBySector((prev) => ({
      ...prev,
      [selectedSector]: nextIndices,
    }));
    void persistMitigationProfile(selectedSector, nextIndices);
  };

  const resetSectorSimulation = () => {
    setAppliedBySector((prev) => ({
      ...prev,
      [selectedSector]: [],
    }));
    void persistMitigationProfile(selectedSector, []);
  };

  const handleExportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      platform: 'QuantumShield AI — Quantum Readiness Score™',
      sector: activeProfile.label,
      score: activeProfile.score,
      riskIndex: activeProfile.riskIndex,
      pqcMigrationPct: activeProfile.pqcMigrationPct,
      status: activeProfile.statusLabel,
      exposedEndpoints: activeProfile.exposedEndpoints,
      legacyCryptoCount: activeProfile.legacyCryptoCount,
      simulatedMitigationsApplied: appliedIndices.map(
        (idx) => activeProfile.recommendations[idx]
      ),
      mitigationRoadmap: activeProfile.recommendations,
    };
    triggerBrowserDownload(
      `quantumshield-readiness-${activeProfile.id}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % SECTOR_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + SECTOR_TABS.length) % SECTOR_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SECTOR_TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetTab = SECTOR_TABS[nextIndex];
      setSelectedSector(targetTab.id);
      const tabButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]'
      )[nextIndex];
      tabButton?.focus();
    }
  };

  // SVG Gauge math (240-degree sweep arc)
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 240 / 360;
  const maxArcLength = circumference * arcFraction;
  const activeArcLength = maxArcLength * (activeProfile.score / 100);

  return (
    <section
      id="readiness"
      className="relative border-b border-slate-800/80 bg-[#060913] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              Proprietary Benchmark
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
              Quantum Readiness Score™
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Quantify post-quantum preparedness across healthcare, microfinance, education,
              government, and industry with real-time cryptographic telemetry.
            </p>
          </div>

          {/* Interactive sector tabs */}
          <div
            role="tablist"
            aria-label="Select sector readiness profile"
            className="flex flex-wrap items-center gap-1 self-start rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 shrink-0 xl:self-auto"
          >
            {SECTOR_TABS.map((tab, idx) => {
              const isSelected = selectedSector === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedSector(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF] ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#06B6D4] to-[#2D7FF9] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Interactive Gauge Card */}
          <div className="glass-surface-elevated flex flex-col items-center justify-between rounded-2xl p-7 lg:col-span-5">
            <div className="flex w-full items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">Active Index</p>
                <h3 className="font-display text-lg font-semibold text-white">
                  {activeProfile.label}
                </h3>
              </div>
              <span
                className={`font-mono text-xs font-semibold whitespace-nowrap shrink-0 ${
                  activeProfile.statusLabel === 'Resilient'
                    ? 'text-emerald-400'
                    : activeProfile.statusLabel === 'Moderate Exposure'
                    ? 'text-[#00FFFF]'
                    : 'text-amber-300'
                }`}
              >
                {activeProfile.statusLabel}
              </span>
            </div>

            {/* Interactive SVG Gauge */}
            <div className="relative my-6 flex h-56 w-56 items-center justify-center">
              <svg
                viewBox="0 0 220 220"
                className="h-full w-full"
                aria-label={`Quantum Readiness Score gauge showing ${activeProfile.score} out of 100`}
              >
                <defs>
                  <linearGradient id="readinessArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00FFFF" />
                    <stop offset="55%" stopColor="#2D7FF9" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                {/* Background Track */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="rgba(30, 41, 59, 0.9)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${maxArcLength} ${circumference}`}
                  transform="rotate(150 110 110)"
                />
                {/* Animated Progress Arc */}
                <motion.circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="url(#readinessArcGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  initial={false}
                  animate={{
                    strokeDasharray: `${activeArcLength} ${circumference}`,
                  }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  transform="rotate(150 110 110)"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
                <span className="text-xs font-medium text-slate-400">Readiness Score</span>
                <p
                  data-testid="active-readiness-score"
                  className="mt-1 font-mono text-4xl font-bold text-white tabular-nums"
                >
                  {activeProfile.score}
                  <span className="text-lg font-medium text-slate-400">/100</span>
                </p>
                <span className="mt-1 font-mono text-xs text-cyan-300 tabular-nums">
                  {activeProfile.pqcMigrationPct}% PQC Migrated
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 border-t border-slate-800 pt-5 text-center">
              <div>
                <p className="font-mono text-lg font-bold text-white tabular-nums">
                  {activeProfile.riskIndex}
                </p>
                <p className="text-[11px] text-slate-400">Risk Index</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-white tabular-nums">
                  {activeProfile.exposedEndpoints}
                </p>
                <p className="text-[11px] text-slate-400">Flagged Nodes</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-amber-300 tabular-nums">
                  {activeProfile.legacyCryptoCount}
                </p>
                <p className="text-[11px] text-slate-400">Legacy Systems</p>
              </div>
            </div>
          </div>

          {/* Sector Comparison Chart & Interactive Mitigation Simulator */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            <div className="glass-surface rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold text-white">
                  Sector Comparison Chart
                </h3>
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Export Report
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {COMPARISON_SECTORS.map((sectorKey) => {
                  const prof = applySectorMitigations(
                    sectorKey,
                    appliedBySector[sectorKey] ?? []
                  );
                  const isHighlighted = selectedSector === sectorKey;
                  return (
                    <button
                      key={sectorKey}
                      type="button"
                      onClick={() => setSelectedSector(sectorKey)}
                      className={`block w-full rounded-xl p-2.5 text-left transition-colors cursor-pointer ${
                        isHighlighted ? 'bg-slate-900/90' : 'hover:bg-slate-900/45'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            isHighlighted ? 'text-[#00FFFF]' : 'text-slate-200'
                          }`}
                        >
                          {prof.label}
                        </span>
                        <span className="font-mono text-slate-300 tabular-nums">
                          {prof.score}/100 · Risk {prof.riskIndex}
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                        <motion.div
                          initial={false}
                          animate={{ width: `${prof.score}%` }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-[#00FFFF] via-[#2D7FF9] to-[#7C3AED]"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Sector Recommendations (Interactive Mitigation Simulator) */}
            <div className="glass-surface rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-[#00FFFF]" aria-hidden="true" />
                  <h3 className="font-display text-base font-semibold text-white">
                    Priority Mitigation Plan · {activeProfile.label}
                  </h3>
                </div>
                {appliedIndices.length > 0 && (
                  <button
                    type="button"
                    onClick={resetSectorSimulation}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-400/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Reset Simulation
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-300">{activeProfile.summary}</p>
              <div className="mt-4 space-y-2.5">
                {activeProfile.recommendations.map((rec, idx) => {
                  const isApplied = appliedIndices.includes(idx);
                  return (
                    <button
                      key={rec}
                      type="button"
                      aria-pressed={isApplied}
                      onClick={() => toggleMitigation(idx)}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                        isApplied
                          ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-100'
                          : 'border-slate-800/80 bg-slate-900/45 text-slate-200 hover:border-cyan-400/40'
                      }`}
                    >
                      <span className="flex items-start gap-2.5">
                        {isApplied ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#00FFFF]"
                            aria-hidden="true"
                          />
                        )}
                        <span>{rec}</span>
                      </span>
                      <span
                        className={`mt-0.5 font-mono text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                          isApplied ? 'text-emerald-300' : 'text-cyan-300'
                        }`}
                      >
                        {isApplied ? 'Applied (+5)' : 'Simulate Fix'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
