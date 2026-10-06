import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRepeatTypes = [
  "none",
  "monthly",
  "yearly",
] as const;

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const title = body.title?.trim();
    const date = body.date;
    const icon = body.icon?.trim() || "calendar";
    const description =
      body.description?.trim() || null;
    const repeatType = body.repeatType || "none";

    // =========================================
    // VALIDATION
    // =========================================

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required.",
        },
        { status: 400 },
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Date is required.",
        },
        { status: 400 },
      );
    }

    if (!allowedRepeatTypes.includes(repeatType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid repeat type.",
        },
        { status: 400 },
      );
    }

    // =========================================
    // INSERT
    // =========================================

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("special_dates")
      .insert({
        title,
        date,
        type: "custom",
        icon,
        description,
        repeat_type: repeatType,
        is_featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Failed to create special date:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to create special date.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Unexpected error creating special date:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}