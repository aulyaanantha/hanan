import { createSupabaseServerClient } from "@/lib/supabase/server";
import { celebrationMessage, jakartaDate, type Celebration } from "@/lib/celebrations/calendar";
import { sendNotificationToPerson } from "@/lib/notifications/send";

export async function sendCelebrationNotifications() {
  const supabase = createSupabaseServerClient();
  const today = jakartaDate();
  const { data, error } = await supabase.from("special_days").select("id,name,date,category,description,source").eq("active", true).eq("date", today);
  if (error) throw new Error("Could not load celebrations");
  const summary = { checked: data?.length ?? 0, completed: 0, pending: 0, skipped: 0 };
  for (const celebration of (data ?? []) as Celebration[]) {
    for (const person of ["Anantha", "Farhan"] as const) {
      // Unique insert is the claim; concurrent cron and catch-up runs cannot both send.
      const { error: claimError } = await supabase.from("celebration_notification_log").insert({ special_day_id: celebration.id, occurrence_date: today, person });
      if (claimError) {
        if (claimError.code === "23505") summary.skipped++;
        else summary.pending++;
        continue;
      }
      const now = new Date();
      if (jakartaDate(now) !== today) { summary.skipped++; continue; }
      const tomorrow = new Date(`${today}T17:00:00Z`).getTime();
      const ttl = Math.max(0, Math.floor((tomorrow - now.getTime()) / 1000));
      try {
        const result = await sendNotificationToPerson(person, { ...celebrationMessage(celebration.name), url: "/special-dates", tag: `celebration:${celebration.id}:${today}:${person}`, ttl });
        if (result.success) summary.completed++;
        else { summary.pending++; console.error("Celebration delivery failed after claim", { id: celebration.id, person }); }
      } catch {
        summary.pending++;
        console.error("Celebration delivery failed after claim", { id: celebration.id, person });
      }
    }
  }
  return summary;
}
