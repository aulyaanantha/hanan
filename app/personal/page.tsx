import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PersonalTransactionButton from "@/components/PersonalTransactionButton";
import PersonalSavingsTable from "@/components/PersonalSavingsTable";
import TodayInfo from "@/components/TodayInfo";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PersonalSavingsPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const { data: transactions, error } = await supabase
    .from("personal_savings")
    .select("*")
    .order("transaction_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Personal savings error:", error);
  }

  const personalTransactions = transactions ?? [];

  const totalDeposit = personalTransactions
    .filter((transaction) => transaction.type === "deposit")
    .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

  const totalWithdrawal = personalTransactions
    .filter((transaction) => transaction.type === "withdrawal")
    .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0);

  const currentBalance = totalDeposit - totalWithdrawal;
  const { data: weeks } = await supabase
    .from("weeks")
    .select("week_number, target_date")
    .order("target_date", {
      ascending: true,
    });

  const today = new Date();

  const currentWeek =
    (weeks ?? []).find(
      (week) => new Date(`${week.target_date}T00:00:00+07:00`) >= today,
    )?.week_number ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        {/* PAGE HEADER */}

        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-700">
              Personal Savings
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage your personal savings and transactions.
            </p>
          </div>

          <TodayInfo weekNumber={currentWeek} />
        </div>

        {/* SUMMARY */}

        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* BALANCE */}

          <div className="soft-card !rounded-[8px] sm:!rounded-2xl p-3 sm:p-5">
            <p className="text-[10px] font-semibold text-indigo-500 sm:text-xs">
              Current Balance
            </p>

            <p className="mt-2 text-sm font-bold tracking-tight text-indigo-500 sm:mt-3 sm:text-2xl">
              {formatRupiah(currentBalance)}
            </p>

            <p className="mt-1 hidden text-[9px] text-slate-400 sm:block sm:text-xs">
              Personal savings
            </p>
          </div>

          {/* DEPOSIT */}

          <div className="soft-card !rounded-[8px] sm:!rounded-2xl p-3 sm:p-5">
            <p className="text-[10px] font-semibold text-emerald-500 sm:text-xs">
              Total Deposit
            </p>

            <p className="mt-2 text-sm font-bold tracking-tight text-emerald-500 sm:mt-3 sm:text-2xl">
              {formatRupiah(totalDeposit)}
            </p>

            <p className="mt-1 hidden text-[9px] text-slate-400 sm:block sm:text-xs">
              Money added
            </p>
          </div>

          {/* WITHDRAWAL */}

          <div className="soft-card !rounded-[8px] sm:!rounded-2xl p-3 sm:p-5">
            <p className="text-[10px] font-semibold text-rose-400 sm:text-xs">
              Total Withdrawal
            </p>

            <p className="mt-2 text-sm font-bold tracking-tight text-rose-400 sm:mt-3 sm:text-2xl">
              {formatRupiah(totalWithdrawal)}
            </p>

            <p className="mt-1 hidden text-[9px] text-slate-400 sm:block sm:text-xs">
              Money withdrawn
            </p>
          </div>
        </section>

        {/* TRANSACTIONS */}

        <section className="mt-6 soft-card rounded-2xl p-5">
          <div className="mt-1 flex justify-end">
            <PersonalTransactionButton />
          </div>

          {/* TABLE */}

          <div className="mt-5">
            <PersonalSavingsTable
              transactions={personalTransactions.map((transaction) => ({
                id: transaction.id,
                type: transaction.type,
                amount: Number(transaction.amount ?? 0),
                transaction_date: transaction.transaction_date,
                note: transaction.note ?? null,
              }))}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
