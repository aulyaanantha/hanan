'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Flag, Heart, Sparkles, Trophy } from 'lucide-react';
import { useMemberName } from '@/components/AccessProvider';
import { getNewMilestone, TARGET_MILESTONES, type TargetMilestone } from '@/lib/dashboard-milestones';

const celebrations = {
  25: { title: '25% — A great start!', message: 'Little by little, getting closer.', Icon: Sparkles },
  50: { title: '50% — Halfway there!', message: 'Half of your dream is already saved.', Icon: Heart },
  75: { title: '75% — Almost there!', message: 'Keep going, together.', Icon: Flag },
  100: { title: '100% — Goal reached!', message: 'You did it, together.', Icon: Trophy },
};

export default function TargetMilestone({ percentage, targetAmount }: { percentage: number; targetAmount: number }) {
  const memberName = useMemberName();
  const anchor = useRef<HTMLDivElement>(null);
  const [milestone, setMilestone] = useState<TargetMilestone | null>(null);

  useEffect(() => {
    const card = anchor.current?.parentElement;
    if (!card || !memberName || !Number.isFinite(targetAmount) || targetAmount <= 0) return;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let triggered = false;
    const storageKey = `hanan-target-milestone:${memberName}`;
    const celebrate = () => {
      if (triggered) return;
      triggered = true;
      // Delay also lets React's development effect replay cancel without consuming it.
      showTimer = setTimeout(() => {
        let previous = 0;
        try {
          const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
          if (stored?.targetAmount === targetAmount && (stored.highest === 0 || TARGET_MILESTONES.includes(stored.highest))) previous = stored.highest;
        } catch { /* Invalid/unavailable browser storage must not affect savings. */ }
        const next = getNewMilestone(percentage, previous);
        try {
          localStorage.setItem(storageKey, JSON.stringify({ targetAmount, highest: next ?? previous }));
        } catch { /* Celebration still works when persistent storage is unavailable. */ }
        setMilestone(next);
        if (next) hideTimer = setTimeout(() => setMilestone(null), 4800);
      }, 650);
    };
    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { celebrate(); observer?.disconnect(); }
      }, { threshold: .4 });
      observer.observe(card);
    } else celebrate();
    return () => { observer?.disconnect(); clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [percentage, targetAmount, memberName]);

  const celebration = milestone ? celebrations[milestone] : null;
  return <div ref={anchor} className="target-milestone-layer">
    <div role="status" aria-live="polite" aria-atomic="true">
      {celebration && <div className="target-milestone-badge" key={`${targetAmount}-${milestone}`}>
        <celebration.Icon size={22} aria-hidden="true" />
        <div><p>{celebration.title}</p><span>{celebration.message}</span></div>
      </div>}
    </div>
    {milestone && <div className="target-milestone-particles" aria-hidden="true" key={`${targetAmount}-${milestone}-particles`}>
      {Array.from({ length: milestone / 5 + 2 }, (_, index) => <span key={index} style={{
        '--particle-x': `${8 + (index * 17) % 84}%`,
        '--particle-drift': `${(index % 2 ? 1 : -1) * (12 + index * 2)}px`,
        '--particle-delay': `${(index % 6) * .1}s`,
      } as CSSProperties}>{milestone === 100 || milestone === 50 ? '♥' : '✦'}</span>)}
    </div>}
  </div>;
}
