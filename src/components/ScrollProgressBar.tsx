import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { computeScrollProgress } from '../utils/scrollProgress';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const updatePercent = () => {
      const ratio = computeScrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      setPercent(Math.round(ratio * 100));
    };

    updatePercent();
    window.addEventListener('scroll', updatePercent, { passive: true });
    window.addEventListener('resize', updatePercent, { passive: true });
    return () => {
      window.removeEventListener('scroll', updatePercent);
      window.removeEventListener('resize', updatePercent);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Page scroll depth"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-testid="scroll-progress-container"
      className="pointer-events-none fixed top-0 right-0 left-0 z-[60] h-[3px] bg-slate-900/50"
    >
      <motion.div
        data-testid="scroll-progress-bar"
        className="h-full w-full origin-left bg-gradient-to-r from-[#00FFFF] via-[#2D7FF9] to-[#7C3AED] shadow-[0_0_14px_rgba(0,255,255,0.85),0_0_6px_rgba(45,127,249,0.9)]"
        style={{ scaleX }}
      />
    </div>
  );
}
