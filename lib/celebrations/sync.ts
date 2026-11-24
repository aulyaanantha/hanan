import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jakartaDate, type CelebrationCategory } from "./calendar";

// The public source publishes Indonesian dates, but is not a government API.
const SOURCE = "https://api-harilibur.pages.dev/";
const fixedObservances = [
  ["Hari Kartini", "04-21", "national", "Remembering R. A. Kartini and her legacy."],
  ["Valentine's Day", "02-14", "international", "A day to celebrate love and care."],
  ["International Women's Day", "03-08", "international", "Recognising women's achievements around the world."],
  ["Earth Day", "04-22", "international", "A day to care for our planet."],
] as const;

function normalizeDate(value: unknown, year: number) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (!match || Number(match[1]) !== year) return null;
  const date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

export async function syncCelebrations() {
  const supabase = createSupabaseServerClient();
  const year = Number(jakartaDate().slice(0, 4));
  const results = [];
  for (const selectedYear of [year, year + 1]) {
    try {
      const syncTime = new Date().toISOString();
      const response = await fetch(`https://api-harilibur.pages.dev/api?year=${selectedYear}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("Empty or invalid source response");
      const rows = new Map<string, { name: string; date: string; year: number; category: CelebrationCategory; description: string; source: string; updated_at: string; active: boolean }>();
      for (const item of data) {
        if (!item || item.is_national_holiday !== true || typeof item.holiday_name !== "string") continue;
        const date = normalizeDate(item.holiday_date, selectedYear);
        const name = item.holiday_name.trim();
        if (!date || !name) continue;
        const category = /islam|hijri|idul|isra|mikraj|maulid|natal|isa|kristus|wafat|kenaikan|paskah|waisak|nyepi|imlek|saka|yesus/i.test(name) ? "religious" : "national";
        const row = { name, date, year: selectedYear, category, description: category === "religious" ? "A religious observance in Indonesia." : "A national observance in Indonesia.", source: SOURCE, updated_at: syncTime, active: true } as const;
        const previous = rows.get(name);
        if (!previous || date < previous.date) rows.set(name, row);
      }
      if (rows.size < 5) throw new Error("Incomplete source response");
      for (const [name, monthDay, category, description] of fixedObservances) rows.set(name, { name, date: `${selectedYear}-${monthDay}`, year: selectedYear, category, description, source: "Curated fixed-date observance", updated_at: syncTime, active: true });
      const { error } = await supabase.from("special_days").upsert([...rows.values()], { onConflict: "name,year" });
      if (error) throw error;
      const { error: staleError } = await supabase.from("special_days").update({ active: false }).eq("year", selectedYear).eq("source", SOURCE).neq("updated_at", syncTime);
      if (staleError) throw staleError;
      results.push({ year: selectedYear, success: true, count: rows.size });
    } catch (error) {
      console.error("Celebration sync failed", { year: selectedYear, error });
      results.push({ year: selectedYear, success: false });
    }
  }
  return { success: results.every(result => result.success), years: results };
}
