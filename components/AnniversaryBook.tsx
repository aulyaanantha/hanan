"use client";

import { Heart, Sparkles } from "lucide-react";
import { formatSpecialDate } from "@/lib/special-dates/date-utils";
import { getAnniversaryDetails } from "@/lib/special-dates/anniversary";

export default function AnniversaryBook({ startDate, celebrationDate }: { startDate: string; celebrationDate: string }) {
  const details = getAnniversaryDetails(startDate, celebrationDate);
  return <div className="anniversary-story">
    <div className="anniversary-hearts" aria-hidden="true">
      <div className="anniversary-thread" />
      <Heart className="anniversary-heart anniversary-heart-farhan" size={36} />
      <Heart className="anniversary-heart anniversary-heart-anantha" size={36} />
      <Sparkles className="anniversary-spark anniversary-spark-one" size={20} />
      <Sparkles className="anniversary-spark anniversary-spark-two" size={14} />
    </div>
    <p className="anniversary-intro">TWO HEARTS. ONE BEAUTIFUL JOURNEY.</p>
    <div className="anniversary-book">
      <div className="anniversary-page anniversary-page-left">
        <Heart className="anniversary-page-heart" size={26} aria-hidden="true" />
        <p className="anniversary-small">OUR STORY BEGAN</p>
        <p className="anniversary-names">Farhan<span>&amp;</span>Anantha</p>
        <div className="anniversary-date">{details ? formatSpecialDate(startDate) : "A moment to treasure"}</div>
        <p className="anniversary-footnote">A little beginning.<br />A lifetime of us.</p>
        <span className="anniversary-page-number" aria-hidden="true">01 / the beginning</span>
      </div>
      <article className="anniversary-page anniversary-page-right">
        <p className="anniversary-small">AND HERE WE ARE</p>
        <h2 id="special-date-celebration-title" className="anniversary-year">{details && details.years > 0 ? <><span>{details.years}</span> {details.years === 1 ? "year" : "years"} of us</> : "Our story, together"}</h2>
        <p className="anniversary-message">Another year of us, and still, you are my favorite place to come home to.</p>
        <p className="anniversary-wish">Happy {details && details.years > 0 ? `${details.anniversary} ` : ""}anniversary, my love.</p>
        <Heart size={18} className="anniversary-ink-heart" aria-hidden="true" />
        <span className="anniversary-page-number" aria-hidden="true">02 / still choosing you</span>
      </article>
    </div>
    <p className="anniversary-days">{details ? <><strong>{details.days.toLocaleString("en-US")}</strong> days of choosing each other</> : "Still choosing each other, every day"}</p>
    <div className="anniversary-footer-hearts" aria-hidden="true"><Heart size={15} /><Heart size={15} /></div>
  </div>;
}
