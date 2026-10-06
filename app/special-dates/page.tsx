import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import TodayInfo from "@/components/TodayInfo";
import SpecialDateCard from "@/components/SpecialDateCard";
import AddSpecialDateModal from "@/components/AddSpecialDateModal";
import SpecialDatesList from "@/components/SpecialDatesList";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CalendarDays } from "lucide-react";
import {
  formatSpecialDate,
  getDaysSince,
  getTodayJakarta,
  getDateInfo,
} from "@/lib/special-dates/date-utils";

export default async function SpecialDatesPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  // =========================================
  // GET TODAY
  // =========================================

  const today = getTodayJakarta();

  // =========================================
  // GET CURRENT HANAN WEEK
  // =========================================

  const { data: weeks } = await supabase
    .from("weeks")
    .select("week_number, target_date")
    .order("week_number", {
      ascending: true,
    });

  const currentWeek =
    weeks?.filter((week) => week.target_date <= today).at(-1)?.week_number ??
    null;

  // =========================================
  // GET FEATURED SPECIAL DATES
  // =========================================

  const { data: featuredDates, error } = await supabase
    .from("special_dates")
    .select("*")
    .eq("is_featured", true);

  const { data: customDates, error: customDatesError } = await supabase
    .from("special_dates")
    .select("*")
    .eq("is_featured", false)
    .order("date", {
      ascending: true,
    });

  if (customDatesError) {
    console.error("Failed to fetch custom special dates:", customDatesError);
  }

  if (error) {
    console.error("Failed to fetch featured special dates:", error);
  }

  // =========================================
  // PREPARE DATE DATA
  // =========================================

  const featuredOrder: Record<string, number> = {
    "Our Anniversary": 1,
    "Farhan's Birthday": 2,
    "Anantha's Birthday": 3,
  };

  const sortedFeaturedDates = [...(featuredDates ?? [])].sort(
    (a, b) => (featuredOrder[a.title] ?? 99) - (featuredOrder[b.title] ?? 99),
  );
  type SpecialDateColor = "indigo" | "red" | "blue" | "pink";

  const cards = sortedFeaturedDates.map((specialDate) => {
    const dateInfo = getDateInfo(
      specialDate.date,
      specialDate.repeat_type,
      today,
    );

    const isAnniversary = specialDate.type === "anniversary";

    const elapsedDays = isAnniversary
      ? getDaysSince(specialDate.date, today)
      : undefined;

    let countdown = dateInfo.label;

    if (isAnniversary && !dateInfo.isToday) {
      countdown =
        elapsedDays !== undefined
          ? `Together for ${elapsedDays} days`
          : dateInfo.label;
    }

    return {
      id: specialDate.id,
      title: specialDate.title,
      date: formatSpecialDate(specialDate.date),
      icon: specialDate.icon ?? "heart",
      countdown,
      isToday: dateInfo.isToday,
      elapsedDays,
      color: (specialDate.title === "Our Anniversary"
        ? "red"
        : specialDate.title === "Farhan's Birthday"
          ? "blue"
          : specialDate.title === "Anantha's Birthday"
            ? "pink"
            : "indigo") as SpecialDateColor,
    };
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        {/* =========================================
            HEADER
        ========================================= */}

        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-700">
              Special Dates
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              The little dates that mean a lot to us.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TodayInfo weekNumber={currentWeek} />
          </div>
        </div>

        {/* =========================================
    FEATURED DATES
========================================= */}

        <section>
          <div className="grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={index === 0 ? "col-span-2 md:col-span-1" : ""}
              >
                <SpecialDateCard
                  title={card.title}
                  date={card.date}
                  icon={card.icon}
                  countdown={card.countdown}
                  isToday={card.isToday}
                  elapsedDays={card.elapsedDays}
                  color={card.color}
                />
              </div>
            ))}
          </div>
        </section>

        {/* =========================================
    OTHER SPECIAL DATES
========================================= */}

        <section className="mt-10">
          <div className="mb-5 w-full">
            <h2 className="text-lg font-bold text-slate-700">
              Other Special Dates
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Add other little moments worth remembering.
            </p>

            <div className="mt-3 flex w-full justify-end">
              <AddSpecialDateModal />
            </div>
          </div>

          {customDates && customDates.length > 0 ? (
            <SpecialDatesList
              dates={customDates.map((specialDate) => {
                const dateInfo = getDateInfo(
                  specialDate.date,
                  specialDate.repeat_type,
                  today,
                );

                return {
                  id: specialDate.id,
                  title: specialDate.title,
                  date: specialDate.date,
                  icon: specialDate.icon ?? "calendar",
                  description: specialDate.description,
                  repeat_type: specialDate.repeat_type,
                  countdown: dateInfo.label,
                  isToday: dateInfo.isToday,
                };
              })}
            />
          ) : (
            <div className="soft-card rounded-3xl p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
                <CalendarDays size={28} strokeWidth={1.8} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-700">
                No other dates yet
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Your custom special dates will appear here.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* FOOTER */}

      <p className="mt-6 text-center text-xs font-medium text-slate-400">
        © 2026 · Made by Anantha
      </p>
    </AppShell>
  );
}
