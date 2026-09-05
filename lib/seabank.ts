import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_ANNUAL_RATE = 0.025;
const DAYS_IN_YEAR = 365;

type Payment = {
  amount: number;
  payment_date: string | null;
};

type Expense = {
  amount: number;
  expense_date: string | null;
};

type PersonalTransaction = {
  amount: number;
  type: "deposit" | "withdrawal";
  transaction_date: string | null;
};

type InterestSettings = {
  start_date: string;
  starting_interest: number;
  annual_rate: number;
};

export type SeaBankCalculation = {
  hananBalance: number;
  personalBalance: number;
  principalBalance: number;

  interestEarned: number;
  dailyInterest: number;

  seaBankBalance: number;

  annualRate: number;
  interestStartDate: string;
  startingInterest: number;
};

/**
 * Get today's date in Asia/Jakarta.
 */
function getTodayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Convert YYYY-MM-DD to a UTC date.
 *
 * We use UTC internally so date-only calculations
 * are not affected by the server timezone.
 */
function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day),
  );
}

/**
 * Format Date as YYYY-MM-DD.
 */
function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Add one day.
 */
function addOneDay(date: Date) {
  const next = new Date(date);

  next.setUTCDate(next.getUTCDate() + 1);

  return next;
}

/**
 * Calculate principal balance on a specific date.
 *
 * Important:
 *
 * Payments with no payment_date are treated as
 * historical payments that already belong to the
 * existing HANAN balance.
 *
 * This prevents old payments from disappearing
 * from the calculation just because their date is null.
 */
function calculatePrincipalForDate(
  date: string,
  payments: Payment[],
  expenses: Expense[],
  personalTransactions: PersonalTransaction[],
) {
  const hananIncome = payments.reduce(
    (total, payment) => {
      if (
        payment.payment_date === null ||
        payment.payment_date <= date
      ) {
        return total + Number(payment.amount);
      }

      return total;
    },
    0,
  );

  const hananExpenses = expenses.reduce(
    (total, expense) => {
      if (
        expense.expense_date !== null &&
        expense.expense_date <= date
      ) {
        return total + Number(expense.amount);
      }

      return total;
    },
    0,
  );

  const personalBalance =
    personalTransactions.reduce(
      (total, transaction) => {
        if (
          transaction.transaction_date === null ||
          transaction.transaction_date > date
        ) {
          return total;
        }

        const amount = Number(transaction.amount);

        if (transaction.type === "deposit") {
          return total + amount;
        }

        if (transaction.type === "withdrawal") {
          return total - amount;
        }

        return total;
      },
      0,
    );

  const hananBalance =
    hananIncome - hananExpenses;

  return hananBalance + personalBalance;
}

/**
 * Calculate current HANAN balance.
 *
 * Undated payments are included because they are
 * historical records and must still contribute to
 * the current HANAN balance.
 */
function calculateCurrentHananBalance(
  payments: Payment[],
  expenses: Expense[],
  today: string,
) {
  const income = payments.reduce(
    (total, payment) => {
      if (
        payment.payment_date === null ||
        payment.payment_date <= today
      ) {
        return total + Number(payment.amount);
      }

      return total;
    },
    0,
  );

  const expense = expenses.reduce(
    (total, item) => {
      if (
        item.expense_date !== null &&
        item.expense_date <= today
      ) {
        return total + Number(item.amount);
      }

      return total;
    },
    0,
  );

  return income - expense;
}

/**
 * Calculate current Personal Savings balance.
 */
function calculateCurrentPersonalBalance(
  personalTransactions: PersonalTransaction[],
  today: string,
) {
  return personalTransactions.reduce(
    (total, transaction) => {
      if (
        transaction.transaction_date === null ||
        transaction.transaction_date > today
      ) {
        return total;
      }

      const amount = Number(transaction.amount);

      if (transaction.type === "deposit") {
        return total + amount;
      }

      if (transaction.type === "withdrawal") {
        return total - amount;
      }

      return total;
    },
    0,
  );
}

/**
 * Calculate SeaBank balance and daily compounded interest.
 *
 * Interest model:
 *
 * - starting_interest is the interest already accumulated
 *   on start_date.
 *
 * - principal = HANAN + Personal Savings.
 *
 * - From the day after start_date, interest compounds daily.
 *
 * - Transactions dated after start_date affect the principal
 *   from their transaction date onward.
 *
 * - Undated historical HANAN payments are included in the
 *   existing principal but are not assigned to a historical
 *   interest day.
 */
export async function calculateSeaBank(): Promise<SeaBankCalculation> {
  const supabase =
    createSupabaseServerClient();

  const [
    paymentsResult,
    expensesResult,
    personalResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, payment_date"),

    supabase
      .from("hanan_expenses")
      .select("amount, expense_date"),

    supabase
      .from("personal_savings")
      .select(
        "amount, type, transaction_date",
      ),

    supabase
      .from("seabank_interest_settings")
      .select(
        "start_date, starting_interest, annual_rate",
      )
      .eq("id", 1)
      .single(),
  ]);

  if (paymentsResult.error) {
    throw new Error(
      `Failed to load HANAN payments: ${paymentsResult.error.message}`,
    );
  }

  if (expensesResult.error) {
    throw new Error(
      `Failed to load HANAN expenses: ${expensesResult.error.message}`,
    );
  }

  if (personalResult.error) {
    throw new Error(
      `Failed to load personal savings: ${personalResult.error.message}`,
    );
  }

  if (settingsResult.error) {
    throw new Error(
      `Failed to load SeaBank interest settings: ${settingsResult.error.message}`,
    );
  }

  const payments =
    (paymentsResult.data ?? []) as Payment[];

  const expenses =
    (expensesResult.data ?? []) as Expense[];

  const personalTransactions =
    (personalResult.data ?? []) as PersonalTransaction[];

  const settings =
    settingsResult.data as InterestSettings;

  const today = getTodayJakarta();

  const annualRate =
    Number(settings.annual_rate) ||
    DEFAULT_ANNUAL_RATE;

  const startingInterest =
    Number(settings.starting_interest) || 0;

  const startDate =
    settings.start_date;

  // ==========================================
  // CURRENT BALANCES
  // ==========================================

  const hananBalance =
    calculateCurrentHananBalance(
      payments,
      expenses,
      today,
    );

  const personalBalance =
    calculateCurrentPersonalBalance(
      personalTransactions,
      today,
    );

  const principalBalance =
    hananBalance + personalBalance;

  // ==========================================
  // INTEREST
  // ==========================================

  let currentInterest =
    startingInterest;

  const startDateObject =
    parseDate(startDate);

  const todayObject =
    parseDate(today);

  /*
   * We start with the configured interest baseline.
   *
   * Example:
   *
   * September 5:
   * starting interest = Rp13,510
   *
   * September 6:
   * calculate one day of interest
   *
   * September 7:
   * calculate another day of interest
   *
   * and so on.
   */
  let currentDate =
    startDateObject;

  while (currentDate < todayObject) {
    const dateForInterest =
      formatDate(currentDate);

    const principal =
      calculatePrincipalForDate(
        dateForInterest,
        payments,
        expenses,
        personalTransactions,
      );

    const seaBankBalance =
      principal + currentInterest;

    const dailyRate =
      annualRate / DAYS_IN_YEAR;

    const interestForDay =
      seaBankBalance * dailyRate;

    currentInterest +=
      interestForDay;

    currentDate =
      addOneDay(currentDate);
  }

  // ==========================================
  // CURRENT SEABANK BALANCE
  // ==========================================

  const seaBankBalance =
    principalBalance + currentInterest;

  const dailyInterest =
    seaBankBalance *
    (annualRate / DAYS_IN_YEAR);

  return {
    hananBalance,
    personalBalance,
    principalBalance,

    interestEarned:
      currentInterest,

    dailyInterest,

    seaBankBalance,

    annualRate,

    interestStartDate:
      startDate,

    startingInterest,
  };
}