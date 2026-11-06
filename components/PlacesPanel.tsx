"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { createPanelScrollLock } from "@/lib/places/panel-scroll";

const lockScroll = createPanelScrollLock();

export default function PlacesPanel({ title, onClose, children, inlineDesktop = false, full = false, centered = false }: {
  title: string; onClose: () => void; children: ReactNode; inlineDesktop?: boolean; full?: boolean; centered?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inline = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const element = dialog.current;
    if (!element) return;
    let unlock: (() => void) | null = null;
    const update = () => {
      if (inlineDesktop && media.matches) {
        element.close();
        element.setAttribute("open", "");
        unlock?.(); unlock = null;
        inline.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
      } else {
        if (!unlock) unlock = lockScroll(document.body);
        element.close(); element.showModal();
      }
    };
    update(); media.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); element.close(); unlock?.(); };
  }, [inlineDesktop]);
  const content = <>{children}</>;
  const header = <header className="places-panel-header"><h2>{title}</h2><div className="flex items-center gap-2">
    {inlineDesktop && <button type="button" className="places-panel-expand md:hidden" aria-label={expanded ? "Reduce panel height" : "Expand panel"} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button>}
    <button type="button" className="places-panel-close" aria-label={`Close ${title}`} onClick={onClose}><X size={20} /></button>
  </div></header>;
  // A single content tree stays mounted as the panel switches between mobile and desktop.
  return <section ref={inline} className={inlineDesktop ? "places-panel-anchor" : undefined}>
    <dialog ref={dialog} className={`places-panel ${inlineDesktop ? "places-panel-inline" : ""} ${expanded ? "places-panel-expanded" : ""} ${full ? "places-panel-full" : ""} ${centered ? "places-panel-centered" : ""}`}
      aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      {header}<div className="places-panel-content">{content}</div>
    </dialog>
  </section>;
}
