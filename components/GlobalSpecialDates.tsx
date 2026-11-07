import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayJakarta } from "@/lib/special-dates/date-utils";
import { buildSpecialDateEffects, type DateEffect } from "@/lib/special-dates/experience";
import SpecialDatesExperience from "./SpecialDatesExperience";

export default async function GlobalSpecialDates() {
  const today = getTodayJakarta();
  let dates: DateEffect[];
  try {
    const { data, error } = await createSupabaseServerClient().from("special_dates")
      .select("id,title,date,repeat_type,icon,type,is_featured").order("date", { ascending: true });
    if (error) { console.error("Could not load global special-date celebrations", { code: error.code }); return null; }
    dates = buildSpecialDateEffects(data ?? [], today);
  } catch {
    // A celebration lookup must not prevent access to the rest of the app.
    console.error("Global special-date celebrations unavailable");
    return null;
  }
  return <SpecialDatesExperience today={today} dates={dates} mode="popup" />;
}
