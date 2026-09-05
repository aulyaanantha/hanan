import { redirect } from "next/navigation";
import { WalletCards, UserRound, Landmark, TrendingUp } from "lucide-react";

import AppShell from "@/components/AppShell";
import TodayInfo from "@/components/TodayInfo";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UpdateSeaBankBalance from "@/components/UpdateSeaBankBalance";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function SeaBankPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const [paymentsResult, expensesResult, personalResult, interestResult, weeksResult] =
    await Promise.all([
      supabase.from("payments").select("amount"),

      supabase.from("hanan_expenses").select("amount"),

      supabase.from("personal_savings").select("amount, type"),

      supabase
        .from("interest_records")
        .select(
          "id, interest_date, base_balance, annual_rate, interest_amount, created_at",
        )
        .order("interest_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("weeks")
        .select("week_number, target_date")
        .order("target_date", { ascending: true }),
    ]);

  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message);
  }

  if (expensesResult.error) {
    throw new Error(expensesResult.error.message);
  }

  if (personalResult.error) {
    throw new Error(personalResult.error.message);
  }

  if (weeksResult.error) {
    throw new Error(weeksResult.error.message);
  }

  const payments = paymentsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const personalTransactions = personalResult.data ?? [];
  const latestInterestRecord = interestResult.data;

  const recordedSeaBankBalance = latestInterestRecord
    ? Number(latestInterestRecord.base_balance)
    : 0;

  const annualRate = latestInterestRecord
    ? Number(latestInterestRecord.annual_rate)
    : 0.025;

  const estimatedDailyInterest = (recordedSeaBankBalance * annualRate) / 365;

  const estimated30DayInterest = estimatedDailyInterest * 30;

  // HANAN SAVINGS

  const hananIncome = payments.reduce(
    (total, item) => total + Number(item.amount),
    0,
  );

  const hananExpense = expenses.reduce(
    (total, item) => total + Number(item.amount),
    0,
  );

  const hananBalance = hananIncome - hananExpense;

  // PERSONAL SAVINGS

  const personalBalance = personalTransactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount);

    if (transaction.type === "deposit") {
      return total + amount;
    }

    if (transaction.type === "withdrawal") {
      return total - amount;
    }

    return total;
  }, 0);

  // OVERALL MONEY

  const overallMoney = hananBalance + personalBalance;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const currentWeek =
    (weeksResult.data ?? []).filter((week) => week.target_date <= today).at(-1)
      ?.week_number ?? null;

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
              Overview of your money across HANAN and personal savings.
            </p>
          </div>

          <TodayInfo weekNumber={currentWeek} />
        </header>

        {/* BALANCE CARDS */}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="soft-card flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400">
                HANAN SAVINGS
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-700">
                {formatRupiah(hananBalance)}
              </p>
            </div>

            <div className="soft-card-inset flex h-12 w-12 items-center justify-center rounded-2xl">
              <WalletCards
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>

          <div className="soft-card flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400">
                PERSONAL SAVINGS
              </p>

              <p className="mt-3 text-2xl font-bold text-slate-700">
                {formatRupiah(personalBalance)}
              </p>
            </div>

            <div className="soft-card-inset flex h-12 w-12 items-center justify-center rounded-2xl">
              <UserRound
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>
        </section>

        {/* OVERALL MONEY */}

        <section className="soft-card p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                OVERALL MONEY
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Total money in SeaBank
              </h2>
            </div>

            <div className="soft-card-inset flex h-12 w-12 items-center justify-center rounded-2xl">
              <Landmark
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>

          <p className="mt-7 text-4xl font-bold tracking-tight text-slate-700">
            {formatRupiah(overallMoney)}
          </p>
        </section>

        {/* RECORDED SEABANK BALANCE */}

        <section className="soft-card p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                RECORDED SEABANK BALANCE
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Current recorded balance
              </h2>
            </div>

            <div className="soft-card-inset flex h-12 w-12 items-center justify-center rounded-2xl">
              <Landmark
                size={21}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-4xl font-bold tracking-tight text-slate-700">
                {formatRupiah(recordedSeaBankBalance)}
              </p>

              {latestInterestRecord && (
                <p className="mt-2 text-xs text-slate-400">
                  Last recorded on {latestInterestRecord.interest_date}
                </p>
              )}

              {!latestInterestRecord && (
                <p className="mt-2 text-xs text-slate-400">
                  No SeaBank balance recorded yet.
                </p>
              )}
            </div>

            <UpdateSeaBankBalance currentBalance={recordedSeaBankBalance} />
          </div>
        </section>

        {/* INTEREST */}

        <section className="soft-card p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                ESTIMATED INTEREST
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Estimated SeaBank interest
              </h2>
            </div>

            <div className="soft-card-inset flex h-12 w-12 items-center justify-center rounded-2xl">
              <TrendingUp
                size={21}
                strokeWidth={1.8}
                className="text-emerald-400"
              />
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="soft-card-inset rounded-2xl p-5">
              <p className="text-xs font-bold tracking-wider text-slate-400">
                ESTIMATED / DAY
              </p>

              <p className="mt-3 text-2xl font-bold text-emerald-500">
                {formatRupiah(estimatedDailyInterest)}
              </p>
            </div>

            <div className="soft-card-inset rounded-2xl p-5">
              <p className="text-xs font-bold tracking-wider text-slate-400">
                ESTIMATED / 30 DAYS
              </p>

              <p className="mt-3 text-2xl font-bold text-emerald-500">
                {formatRupiah(estimated30DayInterest)}
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Estimated using an annual interest rate of{" "}
            {(annualRate * 100).toFixed(2)}%.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
