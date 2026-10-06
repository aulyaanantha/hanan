import { NextResponse } from "next/server";

import { sendPaymentReminders } from "@/lib/notifications/payment-reminder";
import { sendSpecialDateNotifications } from "@/lib/notifications/special-date";

export async function GET(request: Request) {
  try {
    const authHeader =
      request.headers.get("authorization");

    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured.",
      );

      return NextResponse.json(
        {
          error:
            "Server configuration error.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      authHeader !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    console.log(
      "Starting daily notifications...",
    );

    await sendPaymentReminders();

    console.log(
      "Payment reminders completed.",
    );

    await sendSpecialDateNotifications();

    console.log(
      "Special date notifications completed.",
    );

    return NextResponse.json({
      success: true,
      message:
        "Daily notifications processed successfully.",
    });
  } catch (error) {
    console.error(
      "Daily notification failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Could not process daily notifications.",
      },
      {
        status: 500,
      },
    );
  }
}