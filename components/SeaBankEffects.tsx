'use client';

import { useEffect } from 'react';
import { useMemberName } from '@/components/AccessProvider';
import { compareSeaBankSnapshots, type SeaBankSnapshot } from '@/lib/seabank-effects';

export default function SeaBankEffects({ balance, interest, calculationKey }: SeaBankSnapshot) {
  const memberName = useMemberName();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.seabank-motion');
    if (!root || !memberName) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observers: IntersectionObserver[] = [];
    let coin: HTMLSpanElement | undefined;
    const stop = () => { animations.forEach(animation => animation.cancel()); coin?.remove(); };
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    };
    const onceVisible = (element: HTMLElement, callback: () => void) => {
      if (!('IntersectionObserver' in window)) { if (visible(element)) callback(); return; }
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { observer.disconnect(); callback(); }
      }, { threshold: .5 });
      observers.push(observer);
      observer.observe(element);
    };

    // Defer browser storage writes so Strict Mode's effect replay cannot consume a change.
    timers.push(setTimeout(() => {
      const key = `hanan-seabank-last-seen:${memberName}`;
      let previous: unknown = null;
      try {
        previous = JSON.parse(localStorage.getItem(key) ?? 'null');
        localStorage.setItem(key, JSON.stringify({ balance, interest, calculationKey }));
      } catch { /* Storage is optional: skip change-based effects without a baseline. */ }
      const changes = compareSeaBankSnapshots(previous, { balance, interest, calculationKey });
      if (motion.matches) return;
      const breakdown = root.querySelector<HTMLElement>('[data-seabank-breakdown]');
      const trend = root.querySelector<HTMLElement>('[data-seabank-trend]');
      const amount = root.querySelector<HTMLElement>('[data-seabank-total-number]');
      const card = root.querySelector<HTMLElement>('[data-seabank-total-card]');
      if (breakdown) onceVisible(breakdown, () => { breakdown.dataset.revealed = 'true'; });
      if (trend) onceVisible(trend, () => { trend.dataset.drawn = 'true'; });
      if (amount && changes.direction) onceVisible(amount, () => {
        if (!motion.matches) amount.dataset.seabankFlash = changes.direction!;
      });
      if (amount && card && changes.interestIncreased) onceVisible(amount, () => {
        timers.push(setTimeout(() => {
          if (motion.matches || !visible(amount) || typeof card.animate !== 'function') return;
          const interestCard = root.querySelector<HTMLElement>('[data-seabank-interest-card]');
          const interestBreakdown = root.querySelector<HTMLElement>('[data-seabank-interest-origin]');
          // On short screens the Interest entry in the breakdown provides a visible source.
          const source = interestCard && visible(interestCard) ? interestCard : interestBreakdown;
          if (!source || !visible(source)) return;
          const from = source.getBoundingClientRect();
          const to = amount.getBoundingClientRect();
          const startX = from.left + from.width / 2 - 16;
          const startY = from.top + from.height / 2 - 16;
          const endX = to.left + Math.min(to.width / 2, 130) - 16;
          const endY = to.top + to.height / 2 - 16;
          coin = document.createElement('span');
          coin.className = 'dashboard-income-coin';
          coin.textContent = 'Rp';
          coin.setAttribute('aria-hidden', 'true');
          document.body.appendChild(coin);
          const flight = coin.animate([
            { transform: `translate(${startX}px, ${startY}px) scale(.5) rotate(-20deg)`, opacity: 0 },
            { transform: `translate(${startX}px, ${startY - 20}px) scale(1) rotate(0deg)`, opacity: 1, offset: .2 },
            { transform: `translate(${(startX + endX) / 2}px, ${Math.min(startY, endY) - 45}px) scale(1) rotate(160deg)`, opacity: 1, offset: .65 },
            { transform: `translate(${endX}px, ${endY}px) scale(.2) rotate(300deg)`, opacity: 0 },
          ], { duration: 1150, easing: 'ease-in-out', fill: 'both' });
          animations.push(flight);
          flight.onfinish = () => {
            coin?.remove();
            if (motion.matches) return;
            animations.push(card.animate([
              { transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' },
            ], { duration: 550, easing: 'ease-out' }));
          };
        }, 800));
      });
    }, 0));

    const onMotionChange = () => { if (motion.matches) stop(); };
    motion.addEventListener('change', onMotionChange);
    window.addEventListener('scroll', stop, { passive: true });
    window.addEventListener('resize', stop);
    return () => {
      timers.forEach(clearTimeout);
      observers.forEach(observer => observer.disconnect());
      stop();
      root.querySelectorAll<HTMLElement>('[data-revealed], [data-drawn], [data-seabank-flash]').forEach(element => {
        delete element.dataset.revealed; delete element.dataset.drawn; delete element.dataset.seabankFlash;
      });
      motion.removeEventListener('change', onMotionChange);
      window.removeEventListener('scroll', stop);
      window.removeEventListener('resize', stop);
    };
  }, [memberName, balance, interest, calculationKey]);
  return null;
}
