import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthenticated } from "@/lib/session/server";

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      person,
      deviceName,
      subscription,
    } = body;

    if (!person) {
      return NextResponse.json(
        { error: "Person is required" },
        { status: 400 }
      );
    }

    if (!["Anantha", "Farhan"].includes(person)) {
      return NextResponse.json(
        { error: "Invalid person" },
        { status: 400 }
      );
    }

    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Invalid push subscription" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("notification_devices")
      .upsert(
        {
          person,
          device_name: deviceName || null,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      console.error("Failed to save notification device:", error);

      return NextResponse.json(
        { error: "Failed to save notification device" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Subscribe error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}