import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthenticated } from "@/lib/session/server";
import { webpush } from "@/lib/notifications/web-push";

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. CHECK LOGIN
    // ==========================================

    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. GET PERSON
    // ==========================================

    const body = await request.json();

    const person = body.person;

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

    // ==========================================
    // 3. GET DEVICES
    // ==========================================

    const supabase = createSupabaseServerClient();

    const { data: devices, error } = await supabase
      .from("notification_devices")
      .select(
        "id, person, device_name, endpoint, p256dh, auth"
      )
      .eq("person", person);

    if (error) {
      console.error(
        "Failed to get notification devices:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to get notification devices",
        },
        { status: 500 }
      );
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json(
        {
          error: `No notification device found for ${person}.`,
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 4. SEND PUSH TO ALL DEVICES
    // ==========================================

    const payload = JSON.stringify({
      title: "HANAN 💗",
      body: "Test notification berhasil! Push notification Hanan sudah bekerja 🎉",
      url: "/",
    });

    let successCount = 0;

    for (const device of devices) {
      try {
        await webpush.sendNotification(
          {
            endpoint: device.endpoint,
            keys: {
              p256dh: device.p256dh,
              auth: device.auth,
            },
          },
          payload
        );

        successCount++;
      } catch (error: any) {
        console.error(
          `Failed to send notification to ${device.device_name}:`,
          error
        );

        // ==========================================
        // REMOVE EXPIRED / INVALID SUBSCRIPTION
        // ==========================================

        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          await supabase
            .from("notification_devices")
            .delete()
            .eq("id", device.id);
        }
      }
    }

    // ==========================================
    // 5. RESPONSE
    // ==========================================

    if (successCount === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to send notification to any device.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      person,
      sent: successCount,
    });
  } catch (error) {
    console.error(
      "Test notification error:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}