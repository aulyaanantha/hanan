// lib/monthly-recap.ts

import {
  formatMonthYear,
  getMonthRange,
  getPreviousMonth,
} from "@/lib/recap-utils";

type Payment = {
  id: string;
  person: string;
  amount: number | string;
  week_id: string | null;
  payment_date: string;
};

type Expense = {
  id: string;
  amount: number | string;
  expense_date: string;
  reason: string | null;
};

type Week = {
  id: string;
  week_number: number;
  target_date: string;
};

type Memory = {
  id: string;
  image_path: string;
  note: string | null;
  memory_date: string;
  created_at: string;
};

type MonthlyRecapInput = {
  payments: Payment[];
  expenses: Expense[];
  weeks: Week[];
  memories: Memory[];
  targetAmount: number;
};

export type MonthlyRecapData = {
  monthLabel: string;

  saved: number;

  spent: number;

  previousSaved: number;

  growthPercentage: number | null;

  largestExpense: {
    amount: number;
    reason: string;
    date: string;
  } | null;

  memories: {
    id: string;
    imagePath: string;
    note: string;
    memoryDate: string;
  }[];

  savingWeeks: number;

  goalProgress: number;

  balanceAtEndOfMonth: number;
};

export function buildMonthlyRecap({
  payments,
  expenses,
  weeks,
  memories,
  targetAmount,
}: MonthlyRecapInput): MonthlyRecapData {
  // =========================================================
  // RECAP MONTH
  // =========================================================

  const recapMonth = getPreviousMonth();

  const recapRange = getMonthRange(recapMonth);

  // =========================================================
  // PREVIOUS MONTH
  // =========================================================

  const previousMonth = new Date(
    Date.UTC(
      recapMonth.getUTCFullYear(),
      recapMonth.getUTCMonth() - 1,
      1,
    ),
  );

  const previousRange = getMonthRange(previousMonth);

  // =========================================================
  // WEEK MAP
  // =========================================================
  //
  // Monthly Recap menentukan bulan pembayaran berdasarkan
  // weeks.target_date, bukan payments.payment_date.
  //
  // payment
  //    ↓
  // payment.week_id
  //    ↓
  // weeks.id
  //    ↓
  // weeks.target_date
  //
  // payment_date tetap disimpan dan tetap tersedia untuk
  // kebutuhan lain di aplikasi.
  // =========================================================

  const weekMap = new Map(
    weeks.map((week) => [week.id, week]),
  );

  // =========================================================
  // PAYMENTS - RECAP MONTH
  // =========================================================

  // Semua payment berasal dari HANAN Savings.
  // Personal Savings TIDAK masuk di sini.
  //
  // Bulan payment ditentukan dari weeks.target_date.

  const monthlyPayments = payments.filter((payment) => {
    if (!payment.week_id) {
      return false;
    }

    const week = weekMap.get(payment.week_id);

    if (!week) {
      return false;
    }

    return (
      week.target_date >= recapRange.start &&
      week.target_date < recapRange.end
    );
  });

  // =========================================================
  // HANAN SAVED
  // =========================================================

  const saved = monthlyPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  // =========================================================
  // PAYMENTS - PREVIOUS MONTH
  // =========================================================

  const previousMonthPayments = payments.filter((payment) => {
    if (!payment.week_id) {
      return false;
    }

    const week = weekMap.get(payment.week_id);

    if (!week) {
      return false;
    }

    return (
      week.target_date >= previousRange.start &&
      week.target_date < previousRange.end
    );
  });

  const previousSaved = previousMonthPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  // =========================================================
  // GROWTH
  // =========================================================

  let growthPercentage: number | null = null;

  if (previousSaved > 0) {
    growthPercentage =
      ((saved - previousSaved) / previousSaved) * 100;
  }

  // =========================================================
  // EXPENSES - RECAP MONTH
  // =========================================================

  // Expense tetap menggunakan expense_date sebagai
  // tanggal acuan.

  const monthlyExpenses = expenses.filter((expense) => {
    return (
      expense.expense_date >= recapRange.start &&
      expense.expense_date < recapRange.end
    );
  });

  // =========================================================
  // TOTAL SPENT
  // =========================================================

  const spent = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  // =========================================================
  // BIGGEST EXPENSE
  // =========================================================

  const largestExpense =
    monthlyExpenses.length > 0
      ? monthlyExpenses.reduce((largest, expense) => {
          if (!largest) return expense;

          return Number(expense.amount) >
            Number(largest.amount)
            ? expense
            : largest;
        }, monthlyExpenses[0])
      : null;

  // =========================================================
  // MEMORIES
  // =========================================================

  // Memory tetap menggunakan memory_date sebagai
  // tanggal acuan.

  const monthlyMemories = memories.filter((memory) => {
    return (
      memory.memory_date >= recapRange.start &&
      memory.memory_date < recapRange.end
    );
  });

  const recapMemories = monthlyMemories.map((memory) => ({
    id: memory.id,
    imagePath: memory.image_path,
    note: memory.note ?? "",
    memoryDate: memory.memory_date,
  }));

  // =========================================================
  // SAVING WEEKS
  // =========================================================

  // Week dihitung sebagai saving week jika ada payment
  // yang terhubung ke week tersebut dan target_date-nya
  // berada di bulan recap.

  const savingWeeks = monthlyPayments.reduce(
    (weekIds, payment) => {
      if (payment.week_id) {
        weekIds.add(payment.week_id);
      }

      return weekIds;
    },
    new Set<string>(),
  ).size;

  // =========================================================
  // BALANCE AT END OF RECAP MONTH
  // =========================================================

  // Untuk balance historis, payment juga mengikuti
  // weeks.target_date.
  //
  // Expense tetap mengikuti expense_date.

  const paymentsUntilEndOfMonth = payments.filter((payment) => {
    if (!payment.week_id) {
      return false;
    }

    const week = weekMap.get(payment.week_id);

    if (!week) {
      return false;
    }

    return week.target_date < recapRange.end;
  });

  const expensesUntilEndOfMonth = expenses.filter(
    (expense) => expense.expense_date < recapRange.end,
  );

  const totalPaymentsUntilEndOfMonth =
    paymentsUntilEndOfMonth.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    );

  const totalExpensesUntilEndOfMonth =
    expensesUntilEndOfMonth.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );

  const balanceAtEndOfMonth =
    totalPaymentsUntilEndOfMonth -
    totalExpensesUntilEndOfMonth;

  // =========================================================
  // GOAL PROGRESS
  // =========================================================

  const goalProgress =
    targetAmount > 0
      ? Math.min(
          (balanceAtEndOfMonth / targetAmount) * 100,
          100,
        )
      : 0;

  // =========================================================
  // RETURN
  // =========================================================

  return {
    monthLabel: formatMonthYear(recapMonth),

    saved,

    spent,

    previousSaved,

    growthPercentage,

    largestExpense: largestExpense
      ? {
          amount: Number(largestExpense.amount),
          reason: largestExpense.reason ?? "",
          date: largestExpense.expense_date,
        }
      : null,

    memories: recapMemories,

    savingWeeks,

    goalProgress,

    balanceAtEndOfMonth,
  };
}