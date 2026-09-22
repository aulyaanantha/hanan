import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendNotificationToPerson } from "@/lib/notifications/send";

type Person = "Anantha" | "Farhan";

export async function sendPaymentReminders() {
  const supabase = createSupabaseServerClient();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Find the current HANAN week.
  const { data: currentWeek, error: weekError } = await supabase
    .from("weeks")
    .select("id, week_number, target_date")
    .lte("target_date", today)
    .order("target_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (weekError) {
    console.error(
      "Could not find current HANAN week:",
      weekError,
    );
    return;
  }

  if (!currentWeek) {
    console.log("No current HANAN week found.");
    return;
  }

  const people: Person[] = ["Anantha", "Farhan"];

  for (const person of people) {
    // Check whether this person has already paid
    // for the current week.
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id")
      .eq("week_id", currentWeek.id)
      .eq("person", person)
      .maybeSingle();

    if (paymentError) {
      console.error(
        `Could not check payment for ${person}:`,
        paymentError,
      );
      continue;
    }

    // Already paid → no reminder.
    if (payment) {
      continue;
    }

    // Check whether reminder was already sent.
    const { data: existingReminder, error: reminderError } =
      await supabase
        .from("payment_reminders")
        .select("id")
        .eq("week_id", currentWeek.id)
        .eq("person", person)
        .maybeSingle();

    if (reminderError) {
      console.error(
        `Could not check reminder for ${person}:`,
        reminderError,
      );
      continue;
    }

    // Already reminded → do not send again.
    if (existingReminder) {
      continue;
    }

    try {
      await sendNotificationToPerson(person, {
        title: "💰 HANAN Savings",
        body: `Minggu ke-${currentWeek.week_number} sudah dimulai. Jangan lupa melakukan pembayaran HANAN Savings. 💗`,
        url: "/hanan",
      });

      // Save reminder status after successful notification.
      const { error: insertError } = await supabase
        .from("payment_reminders")
        .insert({
          week_id: currentWeek.id,
          person,
        });

      if (insertError) {
        console.error(
          `Reminder sent but could not be saved for ${person}:`,
          insertError,
        );
      }
    } catch (notificationError) {
      console.error(
        `Could not send payment reminder to ${person}:`,
        notificationError,
      );
    }
  }
}