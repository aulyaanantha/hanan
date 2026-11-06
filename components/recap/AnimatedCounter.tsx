'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  start?: boolean;
  onComplete?: () => void;
};

export default function AnimatedCounter({ value, duration = 3000, start = true, onComplete }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!start) return;
    let frame = 0;
    let completed = false;
    const startedAt = performance.now();
    const animationDuration = reducedMotion ? 0 : Math.max(0, duration);
    function tick(now: number) {
      const progress = animationDuration === 0 ? 1 : Math.min((now - startedAt) / animationDuration, 1);
      setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else if (!completed) { completed = true; onComplete?.(); }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, start, onComplete, reducedMotion]);

  const finalText = `Rp${value.toLocaleString('id-ID')}`;
  return <span className="inline-block min-w-[5.5ch] tabular-nums">
    <span className="sr-only">{finalText}</span>
    <span aria-hidden="true">Rp{(start ? reducedMotion ? value : displayValue : 0).toLocaleString('id-ID')}</span>
  </span>;
}
