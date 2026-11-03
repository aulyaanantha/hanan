'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useMemberName } from '@/components/AccessProvider';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
});

export function IncomeCoinArrival() {
  const memberName = useMemberName();
  useEffect(() => {
    if (!memberName) return;
    let pending: { person?: string; savedAt?: number };
    try {
      const value = sessionStorage.getItem('hanan-income-celebration');
      if (!value) return;
      pending = JSON.parse(value);
      if (!pending || pending.person !== memberName || typeof pending.savedAt !== 'number' ||
        Date.now() - pending.savedAt > 10 * 60 * 1000 || pending.savedAt > Date.now()) {
        sessionStorage.removeItem('hanan-income-celebration');
        return;
      }
    } catch { return; }

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let coin: HTMLSpanElement | undefined;
    let flight: Animation | undefined;
    let pulse: Animation | undefined;
    const cleanup = () => { flight?.cancel(); pulse?.cancel(); coin?.remove(); };
    // Defer consumption so React's development effect replay cannot lose the event.
    const frame = requestAnimationFrame(() => {
      const card = document.getElementById('dashboard-savings-balance');
      if (!card) return;
      try { sessionStorage.removeItem('hanan-income-celebration'); } catch { return; }
      if (motion.matches || typeof card.animate !== 'function') return;
      const rect = card.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const endX = rect.right - 46;
      const endY = rect.top + rect.height / 2;
      const startX = Math.min(window.innerWidth - 42, endX + 100);
      const startY = Math.min(window.innerHeight - 60, endY + 170);
      coin = document.createElement('span');
      coin.className = 'dashboard-income-coin';
      coin.textContent = 'Rp';
      coin.setAttribute('aria-hidden', 'true');
      document.body.appendChild(coin);
      flight = coin.animate([
        { transform: `translate(${startX}px, ${startY}px) scale(.65) rotate(-35deg)`, opacity: 0 },
        { transform: `translate(${startX - 20}px, ${startY - 70}px) scale(1) rotate(0deg)`, opacity: 1, offset: .3 },
        { transform: `translate(${endX - 16}px, ${endY - 55}px) scale(1) rotate(180deg)`, opacity: 1, offset: .7 },
        { transform: `translate(${endX - 16}px, ${endY - 16}px) scale(.25) rotate(360deg)`, opacity: 0 },
      ], { duration: 1150, delay: 650, easing: 'ease-in-out', fill: 'both' });
      flight.onfinish = () => {
        coin?.remove();
        if (motion.matches) return;
        pulse = card.animate([
          { transform: 'scale(1)' }, { transform: 'scale(1.025)', offset: .4 }, { transform: 'scale(1)' },
        ], { duration: 550, easing: 'ease-out' });
      };
    });
    const onMotionChange = () => { if (motion.matches) cleanup(); };
    motion.addEventListener('change', onMotionChange);
    window.addEventListener('resize', cleanup);
    window.addEventListener('scroll', cleanup, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cleanup();
      motion.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', cleanup);
      window.removeEventListener('scroll', cleanup);
    };
  }, [memberName]);
  return null;
}

export function AnimatedMoney({ value }: { value: number }) {
  const number = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = number.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      element.textContent = rupiah.format(value);
    };
    if (motion.matches) { finish(); return; }
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element!.textContent = rupiah.format(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    }
    frame = requestAnimationFrame(tick);
    const onMotionChange = () => { if (motion.matches) finish(); };
    motion.addEventListener('change', onMotionChange);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener('change', onMotionChange); };
  }, [value]);
  return <span className="dashboard-money"><span className="sr-only">{rupiah.format(value)}</span><span ref={number} aria-hidden="true">{rupiah.format(value)}</span></span>;
}

export function SavingsRing({ percentage, children }: { percentage: number; children: ReactNode }) {
  return <div
    className="dashboard-ring relative h-44 w-44 lg:h-36 lg:w-36"
    style={{ '--ring-progress': `${percentage}%` } as CSSProperties}
    role="progressbar" aria-label="Progress target HANAN" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}
  >{children}<span className="dashboard-ring-glint" aria-hidden="true" /></div>;
}

export function GoalHearts() {
  return <div className="dashboard-hearts" aria-hidden="true">
    {Array.from({ length: 10 }, (_, index) => <span key={index} style={{
      '--heart-x': `${8 + index * 9}%`,
      '--heart-drift': `${(index % 2 ? 1 : -1) * (12 + index * 3)}px`,
      '--heart-delay': `${.8 + index * .13}s`,
      '--heart-rotation': `${(index % 2 ? 1 : -1) * 24}deg`,
    } as CSSProperties}>♥</span>)}
  </div>;
}
