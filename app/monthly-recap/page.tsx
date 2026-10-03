import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildMonthlyRecap } from "@/lib/monthly-recap";
import MonthlyRecap from "@/components/MonthlyRecap";

export default async function MonthlyRecapPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const [
    paymentsResult,
    expensesResult,
    weeksResult,
    memoriesResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("id, person, amount, week_id, payment_date"),

    supabase
      .from("hanan_expenses")
      .select("id, amount, expense_date, reason"),

    supabase
      .from("weeks")
      .select("id, week_number, target_date")
      .order("week_number", { ascending: true }),

    supabase
      .from("memories")
      .select("id, image_path, note, memory_date, created_at")
      .order("memory_date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("app_settings")
      .select("target_amount")
      .limit(1)
      .single(),
  ]);

  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message);
  }

  if (expensesResult.error) {
    throw new Error(expensesResult.error.message);
  }

  if (weeksResult.error) {
    throw new Error(weeksResult.error.message);
  }

  if (memoriesResult.error) {
    throw new Error(memoriesResult.error.message);
  }

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  const payments = paymentsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const weeks = weeksResult.data ?? [];
  const memories = memoriesResult.data ?? [];
  const targetAmount = Number(settingsResult.data.target_amount);

  const monthlyRecap = buildMonthlyRecap({
    payments,
    expenses,
    weeks,
    memories,
    targetAmount,
  });

  return <MonthlyRecap recap={monthlyRecap} />;
}