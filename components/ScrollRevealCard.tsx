'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export default function ScrollRevealCard({ children }: { children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = card.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element || motion.matches || !('IntersectionObserver' in window)) return;
    element.dataset.revealReady = 'true';
    const reveal = () => {
      element.dataset.revealed = 'true';
      observer.disconnect();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) reveal();
    }, { threshold: .12 });
    observer.observe(element);
    const onMotionChange = () => { if (motion.matches) reveal(); };
    motion.addEventListener('change', onMotionChange);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', onMotionChange);
      delete element.dataset.revealReady;
    };
  }, []);

  return <div ref={card} className="scroll-reveal-card soft-card p-7">{children}</div>;
}
