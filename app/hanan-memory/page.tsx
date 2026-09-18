import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MemoryGrid from "@/components/MemoryGrid";
import AddMemoryModal from "@/components/AddMemoryModal";
import TodayInfo from "@/components/TodayInfo";
import OnThisDay from "@/components/OnThisDay";

export default async function HananMemoryPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: weeks } = await supabase
    .from("weeks")
    .select("week_number, target_date")
    .order("week_number", { ascending: true });

  const currentWeek =
    weeks?.filter((week) => week.target_date <= today).at(-1)?.week_number ??
    null;

  const { data: memories, error } = await supabase
    .from("memories")
    .select("*")
    .order("memory_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch memories:", error);
  }

  const memoriesWithUrl = (memories ?? []).map((memory) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from("memory-images").getPublicUrl(memory.image_path);

    return {
      ...memory,
      image_url: publicUrl,
    };
  });

  // =========================
  // ON THIS DAY
  // =========================

  const todayJakarta = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [currentYearString, currentMonth, currentDay] = todayJakarta.split("-");

  const currentYear = Number(currentYearString);

  const onThisDayMemories = memoriesWithUrl.filter((memory) => {
    const [year, month, day] = memory.memory_date.split("-");

    return (
      Number(year) < currentYear && month === currentMonth && day === currentDay
    );
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-700">
              HANAN Memory
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Little moments from our journey.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TodayInfo weekNumber={currentWeek} />
          </div>
        </div>

        {/* ADD MEMORY */}
        <div className="mt-5 mb-5 flex justify-end">
          <AddMemoryModal />
        </div>

        {/* ON THIS DAY */}
        <OnThisDay memories={onThisDayMemories} />

        {/* MEMORY GRID */}
        <MemoryGrid initialMemories={memoriesWithUrl} />
      </div>

      {/* FOOTER */}

      <p className="mt-6 text-center text-xs font-medium text-slate-400">
        © 2026 · Made by Anantha
      </p>
    </AppShell>
  );
}
