'use client';

import { useEffect } from 'react';
import { useMemberName } from '@/components/AccessProvider';

export default function MemoryGalleryEffects({ memoryIds }: { memoryIds: string }) {
  const memberName = useMemberName();
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-memory-card]');
    if (!cards.length) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pending: { id?: string; person?: string; savedAt?: number } | null = null;
    const key = 'hanan-new-memory';
    try {
      pending = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (pending && (pending.person !== memberName || typeof pending.savedAt !== 'number' ||
        pending.savedAt > Date.now() || Date.now() - pending.savedAt > 600000)) {
        sessionStorage.removeItem(key); pending = null;
      }
    } catch { pending = null; }
    const bursts: HTMLDivElement[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reveal = (card: HTMLElement) => {
      card.dataset.memoryVisible = 'true';
      if (!pending || pending.id !== card.dataset.memoryCard) return;
      try { sessionStorage.removeItem(key); } catch { /* Cosmetic only. */ }
      pending = null;
      if (motion.matches) return;
      const burst = document.createElement('div');
      burst.className = 'memory-new-hearts';
      burst.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 6; index++) {
        const heart = document.createElement('span');
        heart.textContent = '\u2665';
        heart.style.setProperty('--memory-heart-x', `${12 + index * 14}%`);
        heart.style.setProperty('--memory-heart-delay', `${index * .12}s`);
        burst.appendChild(heart);
      }
      card.appendChild(burst);
      bursts.push(burst);
      timers.push(setTimeout(() => burst.remove(), 3000));
    };
    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
          observer?.unobserve(entry.target);
        });
      }, { threshold: .12 });
      cards.forEach(card => {
        if (!motion.matches) card.dataset.memoryReady = 'true';
        observer!.observe(card);
      });
    } else cards.forEach(reveal);
    const onMotionChange = () => {
      if (!motion.matches) return;
      cards.forEach(card => { delete card.dataset.memoryReady; });
      bursts.forEach(burst => burst.remove());
    };
    motion.addEventListener('change', onMotionChange);
    return () => {
      observer?.disconnect();
      timers.forEach(clearTimeout);
      bursts.forEach(burst => burst.remove());
      cards.forEach(card => { delete card.dataset.memoryReady; });
      motion.removeEventListener('change', onMotionChange);
    };
  }, [memberName, memoryIds]);
  return null;
}
