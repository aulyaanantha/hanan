import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { sendNotificationToPerson } from "@/lib/notifications/send";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { person } = await request.json();
    if (person !== "Anantha" && person !== "Farhan") return NextResponse.json({ error: "Invalid person" }, { status: 400 });
    const result = await sendNotificationToPerson(person, { title: "HANAN", body: "Test notification berhasil! Push notification HANAN sudah bekerja.", url: "/" });
    if (!result.success) return NextResponse.json({ ...result, error: result.reason === "no_devices" ? "No active notification device. Please enable notifications again." : "Not all devices accepted the notification. Please retry.", person }, { status: result.reason === "no_devices" ? 404 : 503 });
    return NextResponse.json({ ...result, person });
  } catch { return NextResponse.json({ error: "Could not send test notification." }, { status: 503 }); }
}
