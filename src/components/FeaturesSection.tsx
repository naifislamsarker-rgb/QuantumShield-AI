import { motion } from 'motion/react';
import {
  ScanSearch,
  Gauge,
  Bot,
  Activity,
  LayoutDashboard,
  GitBranch,
} from 'lucide-react';
import { CORE_FEATURES } from '../data/quantumPlatformData';
import { SpotlightCard } from './SpotlightCard';

const FEATURE_ICONS = [
  ScanSearch,
  Gauge,
  Bot,
  Activity,
  LayoutDashboard,
  GitBranch,
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative border-b border-slate-800/80 bg-[#060913] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            Core Capabilities
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
            Unified Quantum Readiness &amp; AI Cyber Intelligence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Engineered as an enterprise cybersecurity copilot uniting cryptographic discovery,
            continuous infrastructure telemetry, and actionable migration guidance.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CORE_FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index] ?? ScanSearch;
            const spanClass = feature.spanWide ? 'lg:col-span-2' : 'lg:col-span-1';
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={spanClass}
              >
                <SpotlightCard
                  spotlightColor="rgba(45, 127, 249, 0.2)"
                  className="flex h-full flex-col justify-between p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-gradient-to-br from-[#00FFFF]/15 to-[#7C3AED]/15 text-[#00FFFF] transition-transform duration-200 group-hover:scale-105">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="font-mono text-xs text-slate-400">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-cyan-200">
                      {feature.description}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                      {feature.capabilityDetail}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
