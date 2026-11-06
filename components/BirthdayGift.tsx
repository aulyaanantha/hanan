"use client";

import { Cake, Heart, Sparkles } from "lucide-react";
import { getBirthdayAge, getBirthdayMessage, type BirthdayPerson } from "@/lib/special-dates/birthday";

export default function BirthdayGift({ name, birthDate, today, viewer }: {
  name: BirthdayPerson; birthDate: string; today: string; viewer: BirthdayPerson | null;
}) {
  const age = getBirthdayAge(birthDate, today);
  const isOwnBirthday = viewer === name;
  return <div className="birthday-gift-stage">
    <div className="birthday-gift-halo" aria-hidden="true" />
    <div className="birthday-gift-sparks" aria-hidden="true">{Array.from({ length: 8 }, (_, i) =>
      <span key={i} style={{ left: `${10 + i * 11}%`, animationDelay: `${1.1 + (i % 4) * .15}s` }}><Sparkles size={i % 2 ? 14 : 20} /></span>
    )}</div>
    <article className="birthday-gift-letter">
      <div className="birthday-letter-icon" aria-hidden="true"><Cake size={28} /></div>
      <p className="special-celebration-eyebrow">{isOwnBirthday ? "TODAY, WE CELEBRATE YOU" : "ANOTHER YEAR, TOGETHER"}</p>
      <h2 id="special-date-celebration-title" className="birthday-letter-heading">For <span>{name}</span>,<br />with love.</h2>
      {age !== null && <div className="birthday-letter-age"><span>{age}</span><span>years of you</span></div>}
      <p className="birthday-letter-message">{getBirthdayMessage(name, age, viewer)}</p>
      <p className="special-celebration-signature">{isOwnBirthday ? `With love, ${name === "Farhan" ? "Anantha" : "Farhan"}` : "Here’s to all the birthdays still to come"} <Heart size={12} aria-hidden="true" /></p>
    </article>
    <div className="birthday-gift-box" aria-hidden="true"><div className="birthday-gift-ribbon" /><Heart size={22} /><span>A LITTLE LOVE, JUST FOR YOU</span></div>
    <div className="birthday-gift-lid" aria-hidden="true"><span className="birthday-bow birthday-bow-left" /><span className="birthday-bow birthday-bow-right" /><span className="birthday-lid-ribbon" /></div>
  </div>;
}
