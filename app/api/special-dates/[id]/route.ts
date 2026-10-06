import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: Params,
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Special date ID is required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    // Pastikan yang dihapus adalah custom date.
    const { data: specialDate, error: findError } =
      await supabase
        .from("special_dates")
        .select("id, is_featured")
        .eq("id", id)
        .single();

    if (findError || !specialDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Special date not found.",
        },
        { status: 404 },
      );
    }

    // Featured date tidak boleh dihapus.
    if (specialDate.is_featured) {
      return NextResponse.json(
        {
          success: false,
          message: "Featured special dates cannot be deleted.",
        },
        { status: 403 },
      );
    }

    const { error: deleteError } = await supabase
      .from("special_dates")
      .delete()
      .eq("id", id)
      .eq("is_featured", false);

    if (deleteError) {
      console.error(
        "Failed to delete special date:",
        deleteError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to delete special date.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Special date deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Unexpected error deleting special date:",
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

export async function PATCH(
  request: Request,
  { params }: Params,
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Special date ID is required.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const title = body.title?.trim();
    const date = body.date;
    const icon = body.icon?.trim() || "calendar";
    const description =
      body.description?.trim() || null;
    const repeatType = body.repeatType || "none";

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

    if (
      !["none", "monthly", "yearly"].includes(
        repeatType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid repeat type.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    // Pastikan date yang diedit adalah custom date.
    const { data: specialDate, error: findError } =
      await supabase
        .from("special_dates")
        .select("id, is_featured")
        .eq("id", id)
        .single();

    if (findError || !specialDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Special date not found.",
        },
        { status: 404 },
      );
    }

    // Featured dates tidak boleh diedit.
    if (specialDate.is_featured) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Featured special dates cannot be edited.",
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("special_dates")
      .update({
        title,
        date,
        icon,
        description,
        repeat_type: repeatType,
      })
      .eq("id", id)
      .eq("is_featured", false)
      .select()
      .single();

    if (error) {
      console.error(
        "Failed to update special date:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to update special date.",
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
      "Unexpected error updating special date:",
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