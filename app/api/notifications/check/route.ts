import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { runDailyNotifications } from "@/lib/notifications/daily";

export const maxDuration = 60;
export async function POST() {
  if (!(await isAuthenticated())) return NextResponse.json({ success: false }, { status: 401 });
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hour < 7) return NextResponse.json({ success: true, skipped: "before_scheduled_time" });
  try {
    const result = await runDailyNotifications();
    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
