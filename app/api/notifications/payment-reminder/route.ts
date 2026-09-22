import { NextResponse } from "next/server";
import { sendPaymentReminders } from "@/lib/notifications/payment-reminder";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    await sendPaymentReminders();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Payment reminder failed:", error);

    return NextResponse.json(
      { error: "Could not send payment reminders." },
      { status: 500 },
    );
  }
}