import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Radar,
  ShieldAlert,
  BrainCircuit,
  Gauge,
  Route,
  Activity,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import { WORKFLOW_STAGES } from '../data/quantumPlatformData';

const STAGE_ICONS = [Radar, ShieldAlert, BrainCircuit, Gauge, Route, Activity];

export function SolutionTimeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = WORKFLOW_STAGES[activeIndex];
  const ActiveIcon = STAGE_ICONS[activeIndex] ?? Radar;

  return (
    <section
      id="solution"
      className="relative border-b border-slate-800/80 bg-[#05070E] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            Our Solution
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
            Meet QuantumShield AI
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            An AI-powered cybersecurity intelligence platform built to assess, monitor, and
            strengthen digital infrastructure against future quantum-enabled threats.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Animated 6-step vertical workflow */}
          <div className="space-y-3 lg:col-span-7">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const Icon = STAGE_ICONS[idx] ?? Radar;
              const isSelected = idx === activeIndex;
              return (
                <div key={stage.step} className="flex flex-col">
                  <motion.button
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF] ${
                      isSelected
                        ? 'border-[#00FFFF]/50 bg-slate-900/90 shadow-[0_0_28px_rgba(6,182,212,0.14)]'
                        : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#00FFFF]/25 to-[#2D7FF9]/25 text-[#00FFFF]'
                          : 'bg-slate-900 text-slate-400 group-hover:text-cyan-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-base font-semibold text-white">
                          {stage.step}. {stage.title}
                        </h3>
                        <span className="font-mono text-xs text-cyan-300/90">{stage.metric}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{stage.summary}</p>
                    </div>
                  </motion.button>

                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <div className="flex justify-center py-1" aria-hidden="true">
                      <ArrowDown className="h-4 w-4 text-[#2D7FF9]/70" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right detail stage inspector */}
          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <motion.div
              key={activeStage.step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="glass-surface-elevated rounded-2xl p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 via-[#2D7FF9]/20 to-[#7C3AED]/20 text-[#00FFFF]">
                  <ActiveIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="font-mono text-xs font-medium text-cyan-300">
                  Stage {activeStage.step} of 06
                </span>
              </div>

              <h3 className="mt-6 font-display text-2xl font-bold text-white">
                {activeStage.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{activeStage.detail}</p>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-medium text-slate-400">Operational Outcome</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#00FFFF]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{activeStage.metric}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev === 0 ? WORKFLOW_STAGES.length - 1 : prev - 1))
                  }
                  className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/50 cursor-pointer"
                >
                  Previous Stage
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev + 1) % WORKFLOW_STAGES.length)
                  }
                  className="rounded-lg bg-gradient-to-r from-[#06B6D4] to-[#2D7FF9] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 cursor-pointer"
                >
                  Next Stage
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
