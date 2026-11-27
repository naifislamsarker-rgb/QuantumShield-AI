import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  HeartPulse,
  Landmark,
  Building2,
  GraduationCap,
  Factory,
  Cpu,
} from 'lucide-react';
import { PROBLEM_STATS, THREAT_CARDS } from '../data/quantumPlatformData';
import { CountUpNumber } from './CountUpNumber';
import { SpotlightCard } from './SpotlightCard';

gsap.registerPlugin(ScrollTrigger);

const THREAT_ICONS = [HeartPulse, Landmark, Building2, GraduationCap, Factory, Cpu];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.threat-card-anim', {
        y: 22,
        opacity: 0.2,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 82%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="relative border-b border-slate-800/80 bg-[#060913] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            Threat Landscape
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-bold tracking-tight text-white">
            The Next Cybersecurity Crisis Has Already Begun
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Today&apos;s digital infrastructure relies heavily on cryptographic systems that may
            become vulnerable in the age of quantum computing. Adversaries already intercept
            encrypted healthcare, financial, and civic records now to decrypt them later.
          </p>
        </div>

        {/* Animated statistics strip */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800/90 bg-slate-950/65 p-5"
            >
              <p className="font-mono text-3xl font-bold text-[#00FFFF] tabular-nums">
                <CountUpNumber
                  value={stat.value}
                  decimals={stat.decimals ?? 0}
                  suffix={stat.suffix}
                />
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 6 Threat Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {THREAT_CARDS.map((card, index) => {
            const Icon = THREAT_ICONS[index] ?? Cpu;
            return (
              <SpotlightCard
                key={card.id}
                spotlightColor="rgba(0, 255, 255, 0.14)"
                className="threat-card-anim p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-[#00FFFF]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-white tabular-nums">
                      <CountUpNumber
                        value={card.metricValue}
                        decimals={card.metricValue % 1 !== 0 ? 1 : 0}
                        suffix={card.metricSuffix}
                      />
                    </p>
                    <p className="text-[11px] text-slate-400">{card.metricLabel}</p>
                  </div>
                </div>

                <p className="mt-5 text-xs font-medium text-cyan-300/90">{card.sectorTag}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{card.description}</p>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
