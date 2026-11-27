import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PRICING_TIERS } from '../data/quantumPlatformData';
import {
  calculatePricingQuote,
  type BillingCycle,
  type PricingTierId,
} from '../utils/quantumReadiness';
import { SpotlightCard } from './SpotlightCard';

interface BusinessModelSectionProps {
  onSelectPlan: (tierId: PricingTierId, planTitle: string) => void;
}

export function BusinessModelSection({ onSelectPlan }: BusinessModelSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');

  return (
    <section
      id="pricing"
      className="relative border-b border-slate-800/80 bg-[#05070E] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              Business Model
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
              Enterprise Licensing Built for National Scale
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Transparent SaaS plans tailored for universities, microfinance networks, hospitals,
              and sovereign government agencies.
            </p>
          </div>

          <div
            role="group"
            aria-label="Billing cycle"
            className="inline-flex items-center gap-1 self-start rounded-xl border border-slate-800 bg-slate-950 p-1"
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-[#06B6D4] to-[#2D7FF9] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual · Save 20%
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const quote = calculatePricingQuote(tier.id, billingCycle);
            return (
              <SpotlightCard
                key={tier.id}
                spotlightColor={
                  tier.highlighted ? 'rgba(0, 255, 255, 0.2)' : 'rgba(45, 127, 249, 0.14)'
                }
                className={`flex flex-col justify-between p-7 ${
                  tier.highlighted ? 'border-[#00FFFF]/45' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-bold text-white">{tier.name}</h3>
                    {tier.highlighted && (
                      <span className="font-mono text-xs font-semibold text-[#00FFFF]">
                        Most Adopted
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-cyan-300">{tier.audience}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{tier.summary}</p>

                  <div className="mt-6 border-y border-slate-800 py-5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-bold text-white tabular-nums">
                        {quote.priceLabel}
                      </span>
                      <span className="text-xs text-slate-400">{quote.cadenceLabel}</span>
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-cyan-300/90">
                      {quote.savingsNote}
                    </p>
                  </div>

                  <dl className="mt-6 space-y-3 text-xs">
                    {tier.limits.map((lim) => (
                      <div key={lim.label} className="flex items-baseline justify-between gap-4">
                        <dt className="text-slate-400">{lim.label}</dt>
                        <dd className="text-right font-medium text-slate-100">{lim.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(tier.id, tier.name)}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all cursor-pointer ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] text-white shadow-[0_0_24px_rgba(45,127,249,0.35)] hover:brightness-110'
                      : 'border border-slate-700 bg-slate-900/80 text-white hover:border-cyan-400/60 hover:bg-slate-800'
                  }`}
                >
                  <span>{tier.ctaLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
