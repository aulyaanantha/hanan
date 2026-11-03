'use client';

import { useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';

export default function ContributionHearts() {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = panel.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.dataset.visible = 'true';
        observer.disconnect();
      }
    }, { threshold: .5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={panel} className="contribution-connection lg:col-span-2">
      <div className="contribution-pair">
        <span className="contribution-name">Farhan</span>
        <div className="contribution-heart-stage" aria-hidden="true">
          <span className="contribution-heart contribution-heart-farhan"><Heart size={28} fill="currentColor" strokeWidth={1.5} /></span>
          <span className="contribution-heart contribution-heart-anantha"><Heart size={28} fill="currentColor" strokeWidth={1.5} /></span>
          <span className="contribution-heart-spark">✦</span>
        </div>
        <span className="contribution-name">Anantha</span>
      </div>
      <p className="contribution-caption">Little by little, together.</p>
    </div>
  );
}
