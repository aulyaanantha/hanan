"use client";

import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  start?: boolean;
  onComplete?: () => void;
};

export default function AnimatedCounter({
  value,
  duration = 3000,
  start = true,
  onComplete,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setDisplayValue(0);
      return;
    }

    let animationFrame: number;
    let completionTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const startTime = performance.now();

    function animate(currentTime: number) {
      if (cancelled) return;

      const elapsed = currentTime - startTime;

      const progress = Math.min(
        elapsed / duration,
        1,
      );

      // Smooth ease-out
      const easedProgress =
        1 - Math.pow(1 - progress, 4);

      const currentValue = Math.round(
        value * easedProgress,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
        return;
      }

      setDisplayValue(value);

      completionTimeout = setTimeout(() => {
        if (!cancelled) {
          onComplete?.();
        }
      }, 120);
    }

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelled = true;

      cancelAnimationFrame(animationFrame);

      if (completionTimeout) {
        clearTimeout(completionTimeout);
      }
    };
  }, [
    value,
    duration,
    start,
    onComplete,
  ]);

  return (
    <span className="inline-block min-w-[5.5ch] tabular-nums">
      Rp{displayValue.toLocaleString("id-ID")}
    </span>
  );
}