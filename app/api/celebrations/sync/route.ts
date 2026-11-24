import { NextResponse } from "next/server";
import { syncCelebrations } from "@/lib/celebrations/sync";

export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await syncCelebrations();
  return NextResponse.json(result, { status: result.success ? 200 : 503 });
}
