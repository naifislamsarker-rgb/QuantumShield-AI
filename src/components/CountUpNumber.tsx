import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

export function CountUpNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  durationMs = 680,
  className = '',
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const hasAnimatedRef = useRef(false);
  const elRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = elRef.current;
    if (!node) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplayValue(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;

        const startTime = performance.now();
        const startVal = 0;

        const tick = (now: number) => {
          const elapsed = Math.max(0, now - startTime);
          const progress = Math.min(elapsed / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = startVal + (value - startVal) * eased;
          setDisplayValue(current);
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            setDisplayValue(value);
          }
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  useEffect(() => {
    if (hasAnimatedRef.current) {
      setDisplayValue(value);
    }
  }, [value]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString('en-US');

  return (
    <span ref={elRef} className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
