
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TodayInfo from "@/components/TodayInfo";
import MemoryMap from "./MemoryMap";
import AppShell from "@/components/AppShell";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function PlacesPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const { data: weeks, error } = await supabase
    .from("weeks")
    .select("week_number, target_date")
    .order("target_date", {
      ascending: true,
    });

  if (error) {
    console.error("Places weeks error:", error);
  }

  const today = formatDate(new Date());

  const currentWeek =
    (weeks ?? [])
      .filter((week) => week.target_date <= today)
      .at(-1)?.week_number ?? null;


  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
              HANAN Places
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Every place has a story.
            </p>
          </div>

          <TodayInfo weekNumber={currentWeek} />
        </div>

        {/* MEMORY MAP */}
        <section className="soft-card rounded-3xl p-4 transition-colors duration-300 md:p-6">
          <MemoryMap />

          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            Every pin will hold a little memory of us
          </p>
        </section>
      </div>

      <p className="mt-6 text-center text-xs font-medium text-[var(--muted)]">
        © 2026 · Made by Anantha
      </p>
    </AppShell>
  );

}
