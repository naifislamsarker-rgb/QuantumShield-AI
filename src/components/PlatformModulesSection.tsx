import { useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import {
  HeartPulse,
  Landmark,
  GraduationCap,
  Factory,
  Building2,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import { PLATFORM_MODULES } from '../data/quantumPlatformData';

const MODULE_ICONS = [HeartPulse, Landmark, GraduationCap, Factory, Building2];

const MODULE_TO_FORM_SECTOR: Record<string, string> = {
  healthsecure: 'Healthcare',
  microfinance: 'Microfinance',
  edusecure: 'Education',
  industrial: 'Industrial & Smart Agriculture',
  govsecure: 'Government',
};

interface PlatformModulesSectionProps {
  onAssessSector?: (sectorLabel: string) => void;
}

export function PlatformModulesSection({ onAssessSector }: PlatformModulesSectionProps) {
  const [activeId, setActiveId] = useState<string>(PLATFORM_MODULES[0].id);
  const activeIndex = Math.max(
    0,
    PLATFORM_MODULES.findIndex((m) => m.id === activeId)
  );
  const activeModule = PLATFORM_MODULES[activeIndex];
  const ActiveIcon = MODULE_ICONS[activeIndex] ?? HeartPulse;

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % PLATFORM_MODULES.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + PLATFORM_MODULES.length) % PLATFORM_MODULES.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = PLATFORM_MODULES.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveId(PLATFORM_MODULES[nextIndex].id);
      const tabButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]'
      )[nextIndex];
      tabButton?.focus();
    }
  };

  return (
    <section
      id="modules"
      className="relative border-b border-slate-800/80 bg-[#05070E] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            Platform Modules
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
            Purpose-Built Protection Across Five Critical Sectors
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Modular intelligence tailored for Bangladesh&apos;s highest-priority digital ecosystems—from
            hospital patient vaults and microfinance payment rails to smart factories and e-government portals.
          </p>
        </div>

        {/* Interactive Module Selector Strip */}
        <div
          role="tablist"
          aria-label="Platform sector modules"
          className="mt-10 flex flex-wrap gap-2"
        >
          {PLATFORM_MODULES.map((mod, idx) => {
            const Icon = MODULE_ICONS[idx] ?? HeartPulse;
            const isSelected = mod.id === activeModule.id;
            return (
              <button
                key={mod.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveId(mod.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF] ${
                  isSelected
                    ? 'border-[#00FFFF]/60 bg-gradient-to-r from-[#06B6D4]/20 via-[#2D7FF9]/20 to-[#7C3AED]/20 text-white shadow-[0_0_24px_rgba(6,182,212,0.18)]'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 text-[#00FFFF]" aria-hidden="true" />
                <span>{mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Deep Dive */}
        <motion.div
          key={activeModule.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          data-testid="active-module-panel"
          className="glass-surface-elevated mt-6 rounded-2xl p-7 lg:p-9"
        >
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#2D7FF9]/20 text-[#00FFFF]">
                  <ActiveIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-cyan-300">{activeModule.sector}</p>
                  <h3 className="font-display text-2xl font-bold text-white">
                    {activeModule.name}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                {activeModule.summary}
              </p>

              <div className="mt-6 flex items-baseline justify-between border-t border-slate-800 pt-5">
                <div>
                  <p className="text-xs text-slate-400">Sector Readiness Benchmark</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-[#00FFFF] tabular-nums">
                    {activeModule.readinessScore}/100
                  </p>
                </div>
                <p className="max-w-[240px] text-right text-xs text-slate-300">
                  {activeModule.deploymentHighlight}
                </p>
              </div>

              {onAssessSector && (
                <button
                  type="button"
                  onClick={() =>
                    onAssessSector(MODULE_TO_FORM_SECTOR[activeModule.id] ?? 'Healthcare')
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-[#00FFFF] transition-all hover:bg-cyan-500/20 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Start Sector Assessment</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Clean divided columns (no nested card-within-card boxes) */}
            <div className="grid gap-6 border-t border-slate-800 pt-6 sm:grid-cols-2 lg:col-span-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Systems Protected
                </p>
                <ul className="mt-4 space-y-2.5">
                  {activeModule.protects.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm font-medium text-slate-100"
                    >
                      <ShieldCheck
                        className="h-4 w-4 shrink-0 text-[#2D7FF9]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Security Capabilities
                </p>
                <ul className="mt-4 space-y-2.5">
                  {activeModule.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2.5 text-sm font-medium text-slate-100"
                    >
                      <Check
                        className="h-4 w-4 shrink-0 text-[#00FFFF]"
                        aria-hidden="true"
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compact 5-Module Directory Summary for fast investor scannability */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PLATFORM_MODULES.map((mod, idx) => {
            const Icon = MODULE_ICONS[idx] ?? HeartPulse;
            const isSelected = mod.id === activeModule.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveId(mod.id)}
                className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400/50 bg-slate-900/90'
                    : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-[#00FFFF]" aria-hidden="true" />
                  <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums">
                    {mod.readinessScore}/100
                  </span>
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-white">
                  {mod.shortName}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {mod.protects.slice(0, 2).join(' · ')}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
