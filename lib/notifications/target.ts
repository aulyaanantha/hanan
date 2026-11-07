import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendNotificationToPerson } from "@/lib/notifications/send";

export async function checkAndSendTargetNotification() {
  const supabase = createSupabaseServerClient();

  // Get current HANAN settings.
  const { data: settings, error: settingsError } = await supabase
    .from("app_settings")
    .select("id, target_amount, target_notification_sent")
    .limit(1)
    .single();

  if (settingsError || !settings) {
    console.error(
      "Could not get app settings for target notification:",
      settingsError,
    );
    throw new Error("Could not load target settings");
  }

  // If notification was already sent for this target,
  // do not send it again.
  if (settings.target_notification_sent) {
    return;
  }

  // Calculate current HANAN balance.
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount");

  if (paymentsError) {
    console.error(
      "Could not get payments for target notification:",
      paymentsError,
    );
    throw new Error("Could not load target payments");
  }

  const { data: expenses, error: expensesError } = await supabase
    .from("hanan_expenses")
    .select("amount");

  if (expensesError) {
    console.error(
      "Could not get expenses for target notification:",
      expensesError,
    );
    throw new Error("Could not load target expenses");
  }

  const totalIncome =
    payments?.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    ) ?? 0;

  const totalExpense =
    expenses?.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    ) ?? 0;

  const hananBalance = totalIncome - totalExpense;
  const targetAmount = Number(settings.target_amount);

  // Target has not been reached yet.
  if (hananBalance < targetAmount) {
    return;
  }

  const formattedTarget = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(targetAmount);

  // Send to both people because this is a shared HANAN milestone.
  const recipients: Array<"Anantha" | "Farhan"> = [
    "Anantha",
    "Farhan",
  ];

  try {
    const deliveries = await Promise.all(
      recipients.map((person) =>
        sendNotificationToPerson(person, {
          title: "🎯 Target HANAN Tercapai!",
          body: `Tabungan HANAN sudah mencapai ${formattedTarget}. Selamat! 💗`,
          url: "/",
          tag: `target:${settings.id}:${targetAmount}`,
        }),
      ),
    );
    if (deliveries.some(delivery => !delivery.success || delivery.sent < 1 || delivery.failed > 0)) return { pending: 1 };
  } catch (notificationError) {
    console.error(
      "Target reached, but notification failed:",
      notificationError,
    );

    // Do not mark as sent if notification failed.
    return { pending: 1 };
  }

  // Mark notification as sent so it won't be sent again.
  const { error: updateError } = await supabase
    .from("app_settings")
    .update({
      target_notification_sent: true,
    })
    .eq("id", settings.id);

  if (updateError) {
    console.error(
      "Target notification was sent, but status could not be updated:",
      updateError,
    );
  }
  return { pending: updateError ? 1 : 0 };
}
