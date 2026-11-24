import { CalendarDays, Globe2, Heart, Sparkles } from "lucide-react";
import { formatCelebrationDate, type Celebration } from "@/lib/celebrations/calendar";

const labels = { national: "Indonesia", religious: "Religious", international: "International" };

function Card({ day }: { day: Celebration }) {
  const Icon = day.category === "national" ? Sparkles : day.category === "religious" ? Heart : Globe2;
  return <article className="soft-card flex min-w-0 gap-4 rounded-3xl p-5">
    <div className="soft-card-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[var(--primary)]"><Icon size={21} /></div>
    <div className="min-w-0"><p className="text-xs font-semibold text-[var(--primary)]">{labels[day.category]}</p>
      <h3 className="mt-1 font-bold text-[var(--foreground)]">{day.name}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{formatCelebrationDate(day.date)}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{day.description}</p>
    </div>
  </article>;
}

export default function CelebrationCalendar({ days, today, unavailable }: { days: Celebration[]; today: string; unavailable: boolean }) {
  const current = days.filter(day => day.date === today);
  const upcoming = days.filter(day => day.date > today).slice(0, 12);
  return <div className="mt-12 space-y-10">
    <section><div className="mb-5"><h2 className="text-lg font-bold text-[var(--foreground)]">Today&apos;s Celebration</h2><p className="mt-1 text-sm text-[var(--muted)]">A little moment to remember today.</p></div>
      {unavailable ? <p className="soft-card rounded-3xl p-6 text-sm text-[var(--muted)]">Celebrations are temporarily unavailable.</p> : current.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{current.map(day => <Card key={day.id} day={day} />)}</div> : <div className="soft-card rounded-3xl p-8 text-center"><CalendarDays className="mx-auto text-[var(--primary)]" size={28} /><p className="mt-3 font-semibold text-[var(--foreground)]">A quiet day to make your own memories</p><p className="mt-1 text-sm text-[var(--muted)]">There are no celebrations on the calendar today.</p></div>}
    </section>
    <section><div className="mb-5"><h2 className="text-lg font-bold text-[var(--foreground)]">Upcoming Celebrations</h2><p className="mt-1 text-sm text-[var(--muted)]">Dates to look forward to, in Jakarta time.</p></div>
      {upcoming.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map(day => <Card key={day.id} day={day} />)}</div> : <p className="soft-card rounded-3xl p-6 text-sm text-[var(--muted)]">No upcoming celebrations are available yet.</p>}
      <p className="mt-4 text-xs text-[var(--muted)]">Indonesian holiday dates are provided by a third-party calendar and may change following official announcements.</p>
    </section>
  </div>;
}
