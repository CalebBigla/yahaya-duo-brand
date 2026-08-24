import { useEffect, useState } from "react";

interface CountUpOptions {
  end: number;
  duration?: number;
  start?: number;
}

export function useCountUp(
  { end, duration = 2000, start = 0 }: CountUpOptions,
  trigger: boolean
) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!trigger) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);

      setCount(current);

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(updateCount);
  }, [trigger, end, duration, start]);

  return count;
}
