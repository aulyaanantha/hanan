import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const endpoint = body.endpoint;

    if (typeof endpoint !== "string" || !endpoint.trim()) {
      return NextResponse.json(
        { error: "Push subscription endpoint is required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("notification_devices")
      .select("person")
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to find notification device:",
        error,
      );

      return NextResponse.json(
        { error: "Failed to identify this device." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "This device has not been registered for notifications yet.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      person: data.person,
    });
  } catch (error) {
    console.error(
      "POST /api/notifications/me error:",
      error,
    );

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}