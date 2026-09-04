import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import HananTabs from "@/components/HananTabs";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import HananTable from "@/components/HananTable";
import AddIncomeModal from "@/components/AddIncomeModal";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function HananPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const [paymentsResult, expensesResult, weeksResult] = await Promise.all([
    supabase.from("payments").select("*"),

    supabase.from("hanan_expenses").select("*"),

    supabase
      .from("weeks")
      .select("*")
      .order("week_number", { ascending: false }),
  ]);

  if (paymentsResult.error) {
    console.error("Payments error:", paymentsResult.error);
  }

  if (expensesResult.error) {
    console.error("Expenses error:", expensesResult.error);
  }

  if (weeksResult.error) {
    console.error("Weeks error:", weeksResult.error);
  }

  const payments = paymentsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const weeks = weeksResult.data ?? [];

  // --------------------------------
  // TOTALS
  // --------------------------------

  const totalIncome = payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0,
  );

  const hananBalance = totalIncome - totalExpense;

  // --------------------------------
  // WEEKLY DATA
  // --------------------------------

  const allWeeklyData = weeks.map((week) => {
    const weekPayments = payments.filter(
      (payment) => payment.week_id === week.id,
    );

    const farhanPayment = weekPayments.find(
      (payment) => payment.person === "Farhan",
    );

    const ananthaPayment = weekPayments.find(
      (payment) => payment.person === "Anantha",
    );

    const farhanAmount = Number(farhanPayment?.amount ?? 0);
    const ananthaAmount = Number(ananthaPayment?.amount ?? 0);

    return {
      id: week.id,
      weekNumber: week.week_number,
      targetDate: week.target_date,
      farhanAmount,
      ananthaAmount,
      total: farhanAmount + ananthaAmount,
    };
  });

  const weeklyData = allWeeklyData.filter((week) => week.total > 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-slate-700">
            HANAN Savings
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage shared savings, contributions, and expenses.
          </p>
        </div>

        {/* TABS */}

        <HananTabs>
          <div className="soft-card-inset rounded-2xl p-4 sm:p-5">
            {/* SUMMARY CARDS */}

            <section className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {/* TOTAL INCOME */}

              <div className="soft-card !rounded-[8px] p-3 sm:!rounded-2xl sm:p-4 lg:p-5">
                <p className="text-[9px] font-bold tracking-wide text-slate-400 sm:text-[10px] lg:text-xs lg:tracking-wider">
                  <span className="lg:hidden">INCOME</span>
                  <span className="hidden lg:inline">TOTAL INCOME</span>
                </p>

                <p className="mt-1 text-sm font-bold tracking-tight text-emerald-500 sm:text-base lg:mt-3 lg:text-2xl">
                  {formatRupiah(totalIncome)}
                </p>

                <p className="mt-1 hidden text-xs text-slate-400 sm:block">
                  Total contributions
                </p>
              </div>

              {/* TOTAL OUTCOME */}

              <div className="soft-card !rounded-[8px] p-3 sm:!rounded-2xl sm:p-4 lg:p-5">
                <p className="text-[9px] font-bold tracking-wide text-slate-400 sm:text-[10px] lg:text-xs lg:tracking-wider">
                  <span className="lg:hidden">OUTCOME</span>
                  <span className="hidden lg:inline">TOTAL OUTCOME</span>
                </p>

                <p className="mt-1 text-sm font-bold tracking-tight text-rose-400 sm:text-base lg:mt-3 lg:text-2xl">
                  {formatRupiah(totalExpense)}
                </p>

                <p className="mt-1 hidden text-xs text-slate-400 sm:block">
                  Total expenses
                </p>
              </div>

              {/* BALANCE */}

              <div className="soft-card !rounded-[8px] p-3 sm:!rounded-2xl sm:p-4 lg:p-5">
                <p className="text-[9px] font-bold tracking-wide text-indigo-400 sm:text-[10px] lg:text-xs lg:tracking-wider">
                  <span className="lg:hidden">SAVINGS</span>
                  <span className="hidden lg:inline">
                    HANAN SAVINGS BALANCE
                  </span>
                </p>

                <p className="mt-1 text-sm font-bold tracking-tight text-indigo-500 sm:text-base lg:mt-3 lg:text-2xl">
                  {formatRupiah(hananBalance)}
                </p>

                <p className="mt-1 hidden text-xs text-slate-400 sm:block">
                  Current shared balance
                </p>
              </div>
            </section>

            {/* ACTION BAR */}

            <div className="mt-5 flex justify-end">
              <AddIncomeModal weeklyData={allWeeklyData} />
            </div>
            <div className="mt-5">
              <HananTable weeklyData={weeklyData} />
            </div>
          </div>
        </HananTabs>
      </div>
    </AppShell>
  );
}
