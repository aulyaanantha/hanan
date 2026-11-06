'use client';

import { useEffect } from 'react';
import { useMemberName } from '@/components/AccessProvider';

export default function SavingsCoinTransfer({ activeTab = 'income', scope = 'hanan' }: {
  activeTab?: 'income' | 'outcome';
  scope?: 'hanan' | 'personal';
}) {
  const memberName = useMemberName();
  useEffect(() => {
    if (!memberName) return;
    const storageKey = scope === 'personal' ? 'hanan-personal-transaction-celebration' : 'hanan-transaction-celebration';
    let pending: { kind?: string; person?: string; savedAt?: number };
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return;
      pending = JSON.parse(stored);
      if (!pending || !['income', 'outcome'].includes(pending.kind ?? '') || pending.person !== memberName ||
        typeof pending.savedAt !== 'number' || pending.savedAt > Date.now() || Date.now() - pending.savedAt > 600000) {
        sessionStorage.removeItem(storageKey);
        return;
      }
    } catch { return; }

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let coin: HTMLSpanElement | undefined;
    const animations: Animation[] = [];
    const stop = () => { animations.forEach(animation => animation.cancel()); coin?.remove(); };
    const frame = requestAnimationFrame(() => {
      const income = document.querySelector<HTMLElement>(scope === 'personal' ? '[data-personal-card="deposit"]' : '[data-savings-card="income"]');
      const outcome = document.querySelector<HTMLElement>(scope === 'personal' ? '[data-personal-card="withdrawal"]' : '[data-savings-card="outcome"]');
      if (!income || !outcome) return;
      try { sessionStorage.removeItem(storageKey); } catch { return; }
      if (motion.matches || typeof income.animate !== 'function') return;
      const destination = pending.kind === 'outcome' ? outcome : income;
      const to = destination.getBoundingClientRect();
      const from = income.getBoundingClientRect();
      if (to.top > window.innerHeight || to.bottom < 0) return;
      const endX = to.left + to.width / 2 - 16;
      const endY = to.top + to.height / 2 - 16;
      const startX = pending.kind === 'outcome' ? from.left + from.width / 2 - 16 : Math.min(window.innerWidth - 42, endX + 90);
      const startY = pending.kind === 'outcome' ? from.top + from.height / 2 - 16 : Math.min(window.innerHeight - 50, endY + 140);
      coin = document.createElement('span');
      coin.className = 'dashboard-income-coin';
      coin.textContent = 'Rp';
      coin.setAttribute('aria-hidden', 'true');
      document.body.appendChild(coin);
      if (pending.kind === 'outcome') animations.push(income.animate([
        { opacity: 1 }, { opacity: .75 }, { opacity: 1 },
      ], { duration: 450, delay: 200 }));
      const flight = coin.animate([
        { transform: `translate(${startX}px, ${startY}px) scale(.6) rotate(-25deg)`, opacity: 0 },
        { transform: `translate(${startX}px, ${startY - 24}px) scale(1) rotate(0deg)`, opacity: 1, offset: .2 },
        { transform: `translate(${(startX + endX) / 2}px, ${Math.min(startY, endY) - 65}px) scale(1.1) rotate(180deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${endX}px, ${endY}px) scale(.2) rotate(360deg)`, opacity: 0 },
      ], { duration: 1150, delay: 250, fill: 'both', easing: 'ease-in-out' });
      animations.push(flight);
      flight.onfinish = () => {
        coin?.remove();
        if (motion.matches) return;
        animations.push(destination.animate([
          { transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' },
        ], { duration: 500, easing: 'ease-out' }));
      };
    });
    const onMotionChange = () => { if (motion.matches) stop(); };
    motion.addEventListener('change', onMotionChange);
    window.addEventListener('resize', stop);
    window.addEventListener('scroll', stop, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      stop();
      motion.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', stop);
      window.removeEventListener('scroll', stop);
    };
  }, [memberName, activeTab, scope]);
  return null;
}
