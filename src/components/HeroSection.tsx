import { ArrowRight, ShieldCheck, Bot, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { QuantumShield3DCanvas } from './QuantumShield3DCanvas';
import { QuantumBackgroundEffects } from './QuantumBackgroundEffects';
import { CountUpNumber } from './CountUpNumber';

interface HeroSectionProps {
  onBookDemo: () => void;
  onExplorePlatform: () => void;
}

const HERO_SECTOR_SNAPS = [
  { label: 'Government', score: 83, color: '#00FFFF' },
  { label: 'Microfinance', score: 81, color: '#2D7FF9' },
  { label: 'Education', score: 76, color: '#38BDF8' },
  { label: 'Healthcare', score: 74, color: '#7C3AED' },
  { label: 'Industry', score: 71, color: '#06B6D4' },
];

export function HeroSection({ onBookDemo, onExplorePlatform }: HeroSectionProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-slate-800/80 bg-[#05070E] pt-10 pb-16 lg:pt-14 lg:pb-20"
    >
      {/* Live cyber grid, aurora lighting, and 3D floating orb network */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 cyber-grid-bg opacity-65" />
      <QuantumBackgroundEffects />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute -top-32 left-[-8%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,255,255,0.14),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-aurora pointer-events-none absolute right-[-6%] bottom-[-15%] h-[480px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.2),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-stretch gap-10 lg:grid-cols-12">
          {/* Left column: Clear hierarchy & single primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 flex flex-col justify-center lg:col-span-6"
          >
            <div className="space-y-1 text-xs font-medium tracking-wide sm:text-sm">
              <p className="text-cyan-300">
                Protect Today. Defend Tomorrow. Secure the Quantum Future.
              </p>
              <p className="text-slate-300">
                Bangladesh&apos;s First AI Quantum Security Platform
              </p>
            </div>

            <h1 className="mt-4 font-display text-[clamp(2.6rem,4.6vw,4.35rem)] leading-[1.04] font-bold tracking-tight text-white">
              QuantumShield{' '}
              <span className="bg-gradient-to-r from-[#00FFFF] via-[#2D7FF9] to-[#7C3AED] bg-clip-text text-transparent">
                AI
              </span>
            </h1>

            <p className="mt-4 text-lg font-semibold text-slate-100 sm:text-xl">
              AI-Powered Quantum Readiness &amp; Critical Infrastructure Protection Platform
            </p>

            <p className="mt-2 text-sm font-medium text-cyan-200/90">
              Safeguarding Bangladesh&apos;s Critical Digital Infrastructure for the Quantum Era
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Bangladesh&apos;s healthcare systems, financial institutions, educational platforms,
              public services, and industrial infrastructure are increasingly dependent on digital
              technology. QuantumShield AI helps organizations prepare for future quantum-era
              cyber threats through intelligent risk assessment, continuous monitoring, and
              AI-powered security recommendations.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onBookDemo}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(45,127,249,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF]"
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onExplorePlatform}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:border-cyan-400/60 hover:bg-slate-800/80 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF]"
              >
                Explore Platform
              </button>
            </div>
          </motion.div>

          {/* Right column: Three.js 3D Holographic Shield + Live Cyber Intelligence Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="min-w-0 flex flex-col gap-4 lg:col-span-6"
          >
            {/* Dedicated unobstructed 3D WebGL viewport */}
            <div className="relative h-[300px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#040711] sm:h-[330px]">
              <QuantumShield3DCanvas />
              {/* Clean corner metadata label — solid rgba surface (no backdrop-blur over WebGL) */}
              <div className="webgl-hud-surface pointer-events-none absolute top-3.5 left-3.5 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-mono text-[#00FFFF]">3D Holographic Defense Core</span>
                <span aria-hidden="true" className="mx-2 text-slate-600">·</span>
                <span className="text-slate-300">Active PQC Telemetry</span>
              </div>
              <div className="webgl-hud-surface pointer-events-none absolute right-3.5 bottom-3.5 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-slate-400">Readiness Index</span>
                <span className="ml-2 font-mono font-semibold text-white tabular-nums">78/100</span>
              </div>
            </div>

            {/* Live Cyber Intelligence Panel below the 3D viewport so zero overlap occurs */}
            <div className="webgl-hud-surface rounded-2xl p-5 shadow-[0_18px_48px_rgba(2,6,23,0.75)]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/12 text-[#00FFFF]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Live Cyber Intelligence Panel</p>
                    <p className="font-display text-sm font-semibold text-white">
                      Bangladesh National Quantum Posture
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Quantum Readiness Score™</p>
                  <p className="font-mono text-2xl font-bold text-[#00FFFF] tabular-nums">
                    <CountUpNumber value={78} />
                    <span className="text-sm font-medium text-slate-400">/100</span>
                  </p>
                </div>
              </div>

              {/* Sector bars + AI Copilot preview */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Activity className="h-3.5 w-3.5 text-[#2D7FF9]" aria-hidden="true" />
                    <span>Sector Readiness Breakdown</span>
                  </div>
                  <div className="space-y-2">
                    {HERO_SECTOR_SNAPS.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">{item.label}</span>
                          <span className="font-mono font-medium text-slate-100 tabular-nums">
                            {item.score}/100
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.score}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-950/75 p-3.5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                      <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>AI Security Copilot Preview</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      &ldquo;Three legacy authentication mechanisms and two outdated encryption
                      systems have been identified as high-risk quantum exposure points.&rdquo;
                    </p>
                  </div>
                  <a
                    href="#copilot"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00FFFF] hover:underline"
                  >
                    Ask AI Copilot
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-width 4-column summary bar below hero split */}
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-8 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="font-mono text-2xl font-bold text-white tabular-nums">
              <CountUpNumber value={5} /> Sectors
            </p>
            <p className="text-xs text-slate-400">
              Healthcare · Microfinance · Education · Industry · Government
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-2xl font-bold text-[#00FFFF] tabular-nums">
              <CountUpNumber value={78} />/100
            </p>
            <p className="text-xs text-slate-400">Composite Quantum Readiness Score™</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-2xl font-bold text-white tabular-nums">
              ML-KEM &amp; ML-DSA
            </p>
            <p className="text-xs text-slate-400">NIST Post-Quantum Cryptographic Readiness</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-2xl font-bold text-white tabular-nums">
              UN SDG 9 · 8 · 16
            </p>
            <p className="text-xs text-slate-400">Resilient National Digital Infrastructure</p>
          </div>
        </div>
      </div>
    </section>
  );
}
