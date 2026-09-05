import { redirect } from "next/navigation";
import { WalletCards, UserRound, Landmark, TrendingUp } from "lucide-react";

import AppShell from "@/components/AppShell";
import TodayInfo from "@/components/TodayInfo";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateSeaBank } from "@/lib/seabank";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTodayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDaysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00+07:00`);
  const end = new Date(`${endDate}T00:00:00+07:00`);

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default async function SeaBankPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const today = getTodayJakarta();

  // ==========================================
  // CURRENT WEEK
  // ==========================================

  const { data: currentWeek, error: weekError } = await supabase
    .from("weeks")
    .select("week_number")
    .lte("target_date", today)
    .order("target_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (weekError) {
    throw new Error(weekError.message);
  }

  // ==========================================
  // AUTOMATIC SEABANK CALCULATION
  // ==========================================

  const seaBank = await calculateSeaBank();

  const {
    hananBalance,
    personalBalance,
    principalBalance,
    interestEarned,
    dailyInterest,
    seaBankBalance,
    annualRate,
    interestStartDate,
  } = seaBank;

  // ==========================================
  // INTEREST INFO
  // ==========================================

  const interestDays = getDaysBetween(interestStartDate, today);

  const estimatedDailyInterest = dailyInterest;

  const estimated30DayInterest = seaBankBalance * (annualRate / 365) * 30;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <AppShell>
      <div className="space-y-8">
        {/* HEADER */}

        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-700">
              SeaBank Balance
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Automatically calculated.
            </p>
          </div>

          <TodayInfo weekNumber={currentWeek?.week_number ?? null} />
        </header>

        {/* BALANCE CARDS */}

        <section className="grid grid-cols-2 gap-3 md:gap-4">
          {/* HANAN */}

          <div className="soft-card flex items-center justify-between p-4 md:p-6">
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400">
                HANAN SAVINGS
              </p>

              <p className="mt-1 text-lg font-bold text-slate-700 md:text-2xl">
                {formatRupiah(hananBalance)}
              </p>
            </div>

            <div className="hidden soft-card-inset h-12 w-12 items-center justify-center rounded-2xl md:flex">
              <WalletCards
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>

          {/* PERSONAL */}

          <div className="soft-card flex items-center justify-between p-4 md:p-6">
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400">
                PERSONAL SAVINGS
              </p>

              <p className="mt-1 text-lg font-bold text-slate-700 md:text-2xl">
                {formatRupiah(personalBalance)}
              </p>
            </div>

            <div className="hidden soft-card-inset h-12 w-12 items-center justify-center rounded-2xl md:flex">
              <UserRound
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>
        </section>

        {/* SEABANK BALANCE */}

        <section className="soft-card p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                SEABANK BALANCE
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Total Money In SeaBank
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Automatically calculated. No manual balance update needed.
              </p>
            </div>

            <div className="soft-card-inset flex h-12 w-16 items-center justify-center rounded-2xl">
              <Landmark
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-700 md:mt-7 md:text-4xl">
            {formatRupiah(seaBankBalance)}
          </p>

          {/* BREAKDOWN */}

          <div className="mt-7 grid grid-cols-3 gap-2 md:gap-4">
            <div className="soft-card-inset rounded-xl p-3 md:rounded-2xl md:p-5">
              <p className="text-xs font-bold tracking-wider text-slate-400">
                HANAN
              </p>

              <p className="mt-2 font-bold text-slate-700">
                <span className="block text-xs md:inline md:text-lg">Rp</span>
                <span className="block text-sm md:inline md:text-lg">
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 0,
                  }).format(hananBalance)}
                </span>
              </p>
            </div>

            <div className="soft-card-inset rounded-xl p-3 md:rounded-2xl md:p-5">
              <p className="text-xs font-bold tracking-wider text-slate-400">
                PERSONAL
              </p>

              <p className="mt-2 font-bold text-slate-700">
                <span className="block text-xs md:inline md:text-lg">Rp</span>
                <span className="block text-sm md:inline md:text-lg">
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 0,
                  }).format(personalBalance)}
                </span>
              </p>
            </div>

            <div className="soft-card-inset rounded-xl p-3 md:rounded-2xl md:p-5">
              <p className="text-xs font-bold tracking-wider text-slate-400">
                INTEREST
              </p>

              <p className="mt-2 font-bold text-emerald-500">
                <span className="block text-xs md:inline md:text-lg">Rp</span>
                <span className="block text-sm md:inline md:text-lg">
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 0,
                  }).format(interestEarned)}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* INTEREST */}

        <section className="soft-card p-4 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                INTEREST
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Interest Earned
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Interest grows automatically every day.
              </p>
            </div>

            <div className="soft-card-inset flex h-12 w-12 items-center justify-center rounded-2xl">
              <TrendingUp
                size={21}
                strokeWidth={1.8}
                className="text-emerald-400"
              />
            </div>
          </div>

          {/* CURRENT INTEREST */}

          <div className="mt-7">
            <div className="soft-card-inset rounded-2xl p-6">
              <p className="text-lg font-bold text-slate-700 md:text-xl">
                Interest Earned So Far
              </p>

              <p className="mt-4 text-2xl font-bold tracking-tight text-emerald-500 md:mt-7 md:text-4xl">
                {formatRupiah(interestEarned)}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Starting from {formatRupiah(13510)} on {interestStartDate}.
                Automatically accumulated for {interestDays}{" "}
                {interestDays === 1 ? "day" : "days"}.
              </p>
            </div>
          </div>

          {/* DAILY + 30 DAYS */}

          <div className="mt-5 grid grid-cols-2 gap-2 md:mt-7 md:gap-4">
            <div className="soft-card-inset rounded-xl p-3 md:rounded-2xl md:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-xs">
                ESTIMATED / DAY
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700 md:mt-2 md:text-lg">
                {formatRupiah(estimatedDailyInterest)}
              </p>
            </div>

            <div className="soft-card-inset rounded-xl p-3 md:rounded-2xl md:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:text-xs">
                ESTIMATED / 30 DAYS
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700 md:mt-2 md:text-lg">
                {formatRupiah(estimated30DayInterest)}
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Based on an annual interest rate of {(annualRate * 100).toFixed(2)}
            %.
          </p>
        </section>
      </div>
      <p className="mt-6 text-center text-xs font-medium text-slate-400">
        © 2026 · Made by Anantha
      </p>
    </AppShell>
  );
}
