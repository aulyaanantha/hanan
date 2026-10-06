import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/session/server";
import { sendSpecialDateNotifications } from "@/lib/notifications/special-date";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    await sendSpecialDateNotifications();

    return NextResponse.json({
      success: true,
      message:
        "Special date notifications checked successfully.",
    });
  } catch (error) {
    console.error(
      "Special date notification error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process special date notifications.",
      },
      {
        status: 500,
      },
    );
  }
}