"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cake, CalendarDays, Flower2, Gem, Heart, PartyPopper, Sparkles, ArrowUpRight, X } from "lucide-react";
import { useMemberName } from "./AccessProvider";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { getTodayJakarta } from "@/lib/special-dates/date-utils";
import { readDateEffects, shouldShowDateCelebration } from "@/lib/special-dates/effects";
import BirthdayGift from "./BirthdayGift";
import AnniversaryBook from "./AnniversaryBook";
import type { BirthdayPerson } from "@/lib/special-dates/birthday";

type DateEffect = { id: string; title: string; icon: string; countdown: string; isToday: boolean; birthday?: { name: BirthdayPerson; birthDate: string }; anniversary?: { startDate: string } };
const icons = { cake: Cake, heart: Heart, calendar: CalendarDays, flower: Flower2, gem: Gem, party: PartyPopper };

export default function SpecialDatesExperience({ today, dates }: { today: string; dates: DateEffect[] }) {
  const member = useMemberName();
  const reduced = useReducedMotion();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [celebrationIndex, setCelebrationIndex] = useState(0);
  const todaysDates = dates.filter(date => date.isToday);
  const specialDates = todaysDates.filter(date => date.birthday || date.anniversary);
  const ordinaryDates = todaysDates.filter(date => !date.birthday && !date.anniversary);
  const specialDate = specialDates[celebrationIndex];
  const birthday = specialDate?.birthday ? specialDate : undefined;
  const anniversary = specialDate?.anniversary;
  const closeCelebration = () => setOpen(false);
  const hasNext = celebrationIndex < specialDates.length + Number(ordinaryDates.length > 0) - 1;
  const advanceCelebration = () => {
    if (hasNext) { setCelebrationIndex(index => index + 1); if (dialog.current) dialog.current.scrollTop = 0; }
    else closeCelebration();
  };

  useEffect(() => {
    if (!member) return;
    const key = `hanan-special-dates:${member}`;
    const popupKey = `${key}:popup`;
    let raw: string | null = null;
    try { raw = localStorage.getItem(key); } catch { /* Optional storage. */ }
    const previous = readDateEffects(raw, today);
    const celebrated = new Set(previous.celebrated);
    const labels = Object.fromEntries(dates.map(date => [date.id, date.countdown]));
    const persist = () => {
      try { localStorage.setItem(key, JSON.stringify({ day: today, labels, celebrated: [...celebrated] })); } catch { /* Optional storage. */ }
    };
    let marker: { id?: string; person?: string; savedAt?: number } = {};
    try { marker = JSON.parse(sessionStorage.getItem("hanan-new-special-date") || "{}") || {}; } catch { /* Optional storage. */ }
    const cards = [...document.querySelectorAll<HTMLElement>("[data-special-date-id]")];
    const particles: HTMLElement[] = [];
    const reveal = (card: HTMLElement) => {
      const date = dates.find(item => item.id === card.dataset.specialDateId);
      if (!date) return;
      card.dataset.revealed = "true";
      if (previous.labels?.[date.id] && previous.labels[date.id] !== date.countdown) card.dataset.countdownChanged = "true";
      if (marker.id === date.id && marker.person === member && marker.savedAt && Date.now() - marker.savedAt < 600000) {
        card.dataset.newDate = "true";
        try { sessionStorage.removeItem("hanan-new-special-date"); } catch { /* Optional storage. */ }
      }
      if (date.isToday && !celebrated.has(date.id)) {
        celebrated.add(date.id);
        card.dataset.celebrating = "true";
        if (!reduced) for (let i = 0; i < 14; i++) {
          const particle = document.createElement("i");
          particle.className = "special-date-confetti";
          particle.setAttribute("aria-hidden", "true");
          particle.style.setProperty("--confetti-x", `${(i / 13) * 100}%`);
          particle.style.setProperty("--confetti-delay", `${(i % 5) * 90}ms`);
          particle.style.setProperty("--confetti-color", ["var(--primary)", "color-mix(in srgb, var(--primary) 65%, white)", "var(--primary-dark)", "color-mix(in srgb, var(--primary) 35%, white)"][i % 4]);
          card.appendChild(particle);
          particles.push(particle);
        }
        persist();
      }
    };
    const observer = !reduced && "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        reveal(entry.target as HTMLElement);
        observer?.unobserve(entry.target);
      }
    }, { threshold: 0.12 }) : null;
    // Defer setup so a development Strict Mode cleanup never consumes a celebration.
    const setup = window.setTimeout(() => {
      cards.forEach(card => {
        if (observer) { card.dataset.motionReady = "true"; observer.observe(card); }
        else reveal(card);
      });
      persist();
    }, 0);
    const popup = window.setTimeout(() => {
      let lastShown: string | null = null;
      try { lastShown = localStorage.getItem(popupKey); } catch { /* Still show without storage. */ }
      if (shouldShowDateCelebration(lastShown, today, dates)) {
        setCelebrationIndex(0);
        setOpen(true);
        try { localStorage.setItem(popupKey, today); } catch { /* Optional storage. */ }
      }
    }, 650);
    const checkDay = () => { if (getTodayJakarta() !== today) router.refresh(); };
    const midnight = window.setInterval(checkDay, 60000);
    document.addEventListener("visibilitychange", checkDay);
    return () => {
      clearTimeout(setup); clearTimeout(popup); clearInterval(midnight);
      document.removeEventListener("visibilitychange", checkDay);
      observer?.disconnect(); particles.forEach(particle => particle.remove());
      cards.forEach(card => { delete card.dataset.motionReady; });
    };
  }, [dates, today, member, reduced, router]);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!element.open) element.showModal();
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);

  return <dialog ref={dialog} className={`special-date-dialog ${anniversary ? "anniversary-dialog" : ""}`} aria-labelledby="special-date-celebration-title"
    onCancel={closeCelebration} onClick={event => { if (event.target === event.currentTarget) {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeCelebration();
    } }}>
    <div key={specialDate?.id ?? "ordinary"} className={`special-celebration-scene ${birthday ? "birthday-celebration-scene" : anniversary ? "anniversary-celebration-scene" : ""}`}>
      <div className="special-celebration-aura" aria-hidden="true" />
      <div className="special-celebration-orbit" aria-hidden="true">
        <Heart className="celebration-float celebration-float-one" size={30} />
        <Sparkles className="celebration-float celebration-float-two" size={32} />
        <Heart className="celebration-float celebration-float-three" size={18} />
        <span className="celebration-little-star">✦</span>
      </div>
      <button type="button" autoFocus className="special-date-dialog-close" aria-label="Close celebration" onClick={closeCelebration}><X size={20} /></button>
      {anniversary ? <AnniversaryBook startDate={anniversary.startDate} celebrationDate={today} /> : birthday?.birthday ? <BirthdayGift {...birthday.birthday} today={today} viewer={member} /> : <>
      <div className="special-celebration-letter">
        <div className="special-celebration-stamp" aria-hidden="true"><Heart size={23} /></div>
        <p className="special-celebration-eyebrow">A DATE TO TREASURE</p>
        <h2 id="special-date-celebration-title" className="special-celebration-heading">Today is<br />the day you have been <span>waiting for</span></h2>
        <p className="special-celebration-note">and that day is...</p>
        <div className="special-celebration-events">{ordinaryDates.map(date => {
      const Icon = icons[date.icon as keyof typeof icons] ?? CalendarDays;
      return <div key={date.id} className="special-celebration-event"><Icon className="shrink-0" size={23} /><span>{date.title}</span></div>;
    })}</div>
        <div className="special-celebration-signature">With love, Farhan &amp; Anantha <Heart size={12} aria-hidden="true" /></div>
      </div>
      <div className="special-celebration-envelope" aria-hidden="true"><span>HANAN / little moments, forever</span></div>
      </>}
      <button type="button" className="special-celebration-action" onClick={advanceCelebration}>{hasNext ? "Another little celebration" : anniversary ? "Here’s to our next chapter" : birthday ? "Keep this moment close" : "Make a memory today"} <ArrowUpRight size={18} /></button>
    </div>
  </dialog>;
}
