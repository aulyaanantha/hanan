import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetAmount = Number(body.targetAmount);

    if (!targetAmount || targetAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid target amount." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: settings, error: fetchError } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .single();

    if (fetchError || !settings) {
      console.error(fetchError);

      return NextResponse.json(
        { error: "Could not find app settings." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("app_settings")
      .update({
        target_amount: targetAmount,
      })
      .eq("id", settings.id);

    if (updateError) {
      console.error(updateError);

      return NextResponse.json(
        { error: "Could not update target." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      targetAmount,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}