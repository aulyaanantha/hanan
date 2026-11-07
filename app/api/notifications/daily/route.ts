import { NextResponse } from "next/server";
import { runDailyNotifications } from "@/lib/notifications/daily";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  try {
    const result = await runDailyNotifications();
    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch {
    return NextResponse.json({ success: false, error: "Notification processing failed." }, { status: 503 });
  }
}
