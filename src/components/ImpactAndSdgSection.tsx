import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';
import {
  SDG_ALIGNMENTS,
  SOCIAL_IMPACT_AREAS,
  WHY_QUANTUMSHIELD_CARDS,
} from '../data/quantumPlatformData';
import { SpotlightCard } from './SpotlightCard';

export function ImpactAndSdgSection() {
  const [activeSdg, setActiveSdg] = useState<string>(SDG_ALIGNMENTS[0].number);

  return (
    <>
      {/* Section 10: Social Impact */}
      <section
        id="impact"
        className="relative border-b border-slate-800/80 bg-[#060913] py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                Social &amp; National Impact
              </p>
              <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
                Building a Quantum-Safe Bangladesh
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                QuantumShield AI is Bangladesh&apos;s first AI-powered Quantum Readiness and
                Critical Infrastructure Protection Platform—designed to defend essential services
                and strengthen public digital trust for decades ahead.
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm font-medium text-cyan-200">
                <Globe2 className="h-5 w-5 text-[#00FFFF]" aria-hidden="true" />
                <span>Seven pillars of national cyber resilience</span>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:col-span-7">
              {SOCIAL_IMPACT_AREAS.map((area, idx) => (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className={`rounded-2xl border border-slate-800/90 bg-slate-950/75 p-4 ${
                    idx === SOCIAL_IMPACT_AREAS.length - 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#00FFFF]"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-display text-sm font-semibold text-white">
                        {area.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {area.detail}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 11: SDG Alignment */}
      <section
        id="sdg"
        className="relative border-b border-slate-800/80 bg-[#05070E] py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              Global Development Alignment
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
              UN Sustainable Development Goals
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Advancing resilient national infrastructure, inclusive digital economic growth, and
              accountable public institutions across Bangladesh.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {SDG_ALIGNMENTS.map((sdg) => {
              const isSelected = activeSdg === sdg.number;
              return (
                <button
                  key={sdg.number}
                  type="button"
                  onClick={() => setActiveSdg(sdg.number)}
                  aria-pressed={isSelected}
                  className={`group flex flex-col justify-between rounded-2xl border p-7 text-left transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF] ${
                    isSelected
                      ? 'glass-surface-elevated border-[#00FFFF]/50 shadow-[0_0_32px_rgba(6,182,212,0.16)]'
                      : 'glass-surface border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: sdg.accentHex }}
                      >
                        {sdg.tier}
                      </span>
                      <span className="font-mono text-xl font-bold text-white">
                        {sdg.number}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold text-white">
                      {sdg.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {sdg.focus}
                    </p>
                  </div>

                  <p className="mt-6 border-t border-slate-800 pt-4 font-mono text-xs text-cyan-200">
                    {sdg.impactMetric}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 12: Why QuantumShield AI */}
      <section
        id="why-quantumshield"
        className="relative border-b border-slate-800/80 bg-[#060913] py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              Strategic Advantage
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
              Why QuantumShield AI
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Built for institutional trust, investor-grade scalability, and sovereign national
              quantum readiness.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_QUANTUMSHIELD_CARDS.map((card, idx) => (
              <SpotlightCard
                key={card.title}
                spotlightColor="rgba(124, 58, 237, 0.16)"
                className="p-5"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="h-4 w-4 text-[#00FFFF]" aria-hidden="true" />
                  <span className="font-mono text-xs text-slate-500">0{idx + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {card.detail}
                </p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
