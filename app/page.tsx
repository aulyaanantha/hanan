import { redirect } from "next/navigation";
import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import TodayInfo from "@/components/TodayInfo";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChangeTarget from "@/components/ChangeTarget";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function Home() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const [paymentsResult, expensesResult, settingsResult, weeksResult] =
    await Promise.all([
      supabase.from("payments").select("person, amount, week_id"),

      supabase.from("hanan_expenses").select("amount"),

      supabase.from("app_settings").select("target_amount").limit(1).single(),

      supabase
        .from("weeks")
        .select("id, week_number, target_date")
        .order("week_number", { ascending: true }),
    ]);

  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message);
  }

  if (expensesResult.error) {
    throw new Error(expensesResult.error.message);
  }

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  if (weeksResult.error) {
    throw new Error(weeksResult.error.message);
  }

  const payments = paymentsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const weeks = weeksResult.data ?? [];

  // ================================
  // TOTAL PEMASUKAN
  // ================================

  const totalIncome = payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  // ================================
  // TOTAL PENGELUARAN
  // ================================

  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  // ================================
  // SALDO HANAN
  // ================================

  const hananBalance = totalIncome - totalExpense;

  // ================================
  // KONTRIBUSI PER ORANG
  // ================================

  const farhanTotal = payments
    .filter((payment) => payment.person === "Farhan")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  const ananthaTotal = payments
    .filter((payment) => payment.person === "Anantha")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  // ================================
  // TARGET
  // ================================

  const targetAmount = Number(settingsResult.data.target_amount);

  const progressPercentage =
    targetAmount > 0 ? (hananBalance / targetAmount) * 100 : 0;

  const progressWidth = Math.min(progressPercentage, 100);

  // ================================
  // CURRENT WEEK
  // ================================

  const now = new Date();
  const today = formatDate(now);

  const currentWeek =
    weeks.filter((week) => week.target_date <= today).at(-1) ?? null;

  // ================================
  // LAST CONTRIBUTION
  // ================================

  const weekMap = new Map(weeks.map((week) => [week.id, week]));

  let farhanLastWeek: number | null = null;
  let ananthaLastWeek: number | null = null;

  for (const payment of payments) {
    const week = weekMap.get(payment.week_id);

    if (!week) continue;

    if (payment.person === "Farhan") {
      if (farhanLastWeek === null || week.week_number > farhanLastWeek) {
        farhanLastWeek = week.week_number;
      }
    }

    if (payment.person === "Anantha") {
      if (ananthaLastWeek === null || week.week_number > ananthaLastWeek) {
        ananthaLastWeek = week.week_number;
      }
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* ================================
            HEADER
        ================================= */}

        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-700">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage shared savings, contributions, and expenses.
            </p>
          </div>

          <TodayInfo weekNumber={currentWeek?.week_number ?? null} />
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* LEFT SUMMARY */}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {/* TOTAL BALANCE */}

            <div className="soft-card col-span-2 flex items-center justify-between p-5 lg:col-span-1 lg:p-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 lg:text-[10px]">
                  TOTAL BALANCE
                </p>

                <p className="mt-3 text-2xl font-bold tracking-tight text-slate-700 lg:mt-2 lg:text-xl">
                  {formatRupiah(hananBalance)}
                </p>

                <p className="mt-1 text-xs text-slate-400 lg:text-[10px]">
                  HANAN savings balance
                </p>
              </div>

              <div className="soft-card-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl lg:h-10 lg:w-10">
                <Wallet
                  size={21}
                  strokeWidth={1.8}
                  className="text-indigo-400 lg:h-[18px] lg:w-[18px]"
                />
              </div>
            </div>

            {/* MONEY IN */}

            <div className="soft-card flex items-center justify-between p-5 lg:p-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 lg:text-[10px]">
                  MONEY IN
                </p>

                <p className="mt-3 text-xl font-bold tracking-tight text-emerald-500 lg:mt-2 lg:text-lg">
                  {formatRupiah(totalIncome)}
                </p>

                <p className="mt-1 text-xs text-slate-400 lg:text-[10px]">
                  Total income
                </p>
              </div>

              {/* Icon: desktop only */}
              <div className="soft-card-inset hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl lg:flex">
                <ArrowDownLeft
                  size={18}
                  strokeWidth={1.8}
                  className="text-emerald-400"
                />
              </div>
            </div>

            {/* MONEY OUT */}

            <div className="soft-card flex items-center justify-between p-5 lg:p-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 lg:text-[10px]">
                  MONEY OUT
                </p>

                <p className="mt-3 text-xl font-bold tracking-tight text-rose-400 lg:mt-2 lg:text-lg">
                  {formatRupiah(totalExpense)}
                </p>

                <p className="mt-1 text-xs text-slate-400 lg:text-[10px]">
                  Total expenses
                </p>
              </div>

              {/* Icon: desktop only */}
              <div className="soft-card-inset hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl lg:flex">
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.8}
                  className="text-rose-400"
                />
              </div>
            </div>
          </div>

          {/* HANAN TARGET */}

          <div className="soft-card flex flex-col justify-between p-6 lg:p-5">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-wider text-indigo-400 lg:text-[10px]">
                    HANAN TARGET
                  </p>

                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-700 lg:mt-2 lg:text-3xl">
                    Now {progressPercentage.toFixed(2)}%
                  </p>
                </div>

                <ChangeTarget currentTarget={targetAmount} />
              </div>

              <div className="mt-6 flex justify-center lg:mt-4">
                <div
                  className="relative h-44 w-44 lg:h-36 lg:w-36"
                  style={{
                    background: `conic-gradient(
                      #7182f5 0% ${progressWidth}%,
                      #dfe4eb ${progressWidth}% 100%
                    )`,
                    borderRadius: "50%",
                  }}
                >
                  <div
                    className="absolute inset-[12px] flex items-center justify-center rounded-full bg-[#e8edf3] lg:inset-[10px]"
                    style={{
                      boxShadow:
                        "inset 5px 5px 10px rgba(174, 184, 196, 0.45), inset -5px -5px 10px rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    <div className="text-center">
                      <p className="text-3xl font-bold tracking-tight text-slate-700 lg:text-2xl">
                        Good Job
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-400 lg:mt-4 lg:text-[10px]">
              <span>{formatRupiah(hananBalance)}</span>

              <span>Target {formatRupiah(targetAmount)}</span>
            </div>
          </div>
        </section>

        {/* ================================
            CONTRIBUTIONS
        ================================= */}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LAST CONTRIBUTION */}

          <div className="soft-card p-7">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                LAST CONTRIBUTION
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Kontribusi terakhir
              </h2>
            </div>

            <div className="mt-7 space-y-4">
              <div className="soft-card-inset flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Farhan</p>

                  <p className="mt-1 text-xs text-slate-400">
                    Minggu terakhir setor
                  </p>
                </div>

                <span className="text-lg font-bold text-indigo-500">
                  {farhanLastWeek ? `M${farhanLastWeek}` : "—"}
                </span>
              </div>

              <div className="soft-card-inset flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Anantha
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Minggu terakhir setor
                  </p>
                </div>

                <span className="text-lg font-bold text-indigo-500">
                  {ananthaLastWeek ? `M${ananthaLastWeek}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL CONTRIBUTION */}

          <div className="soft-card p-7">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                TOTAL CONTRIBUTION
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-700">
                Total kontribusi
              </h2>
            </div>

            <div className="mt-7 space-y-4">
              <div className="soft-card-inset flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Farhan</p>

                  <p className="mt-1 text-xs text-slate-400">
                    Total seluruh kontribusi
                  </p>
                </div>

                <span className="text-lg font-bold text-slate-700">
                  {formatRupiah(farhanTotal)}
                </span>
              </div>

              <div className="soft-card-inset flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Anantha
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Total seluruh kontribusi
                  </p>
                </div>

                <span className="text-lg font-bold text-slate-700">
                  {formatRupiah(ananthaTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <p className="mt-6 text-center text-xs font-medium text-slate-400">
        © 2026 · Made by Anantha
      </p>
    </AppShell>
  );
}
