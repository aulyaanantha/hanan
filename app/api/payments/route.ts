import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const person = body.person;
    const weekId = body.weekId;
    const amount = Number(body.amount);

    if (person !== "Farhan" && person !== "Anantha") {
      return NextResponse.json(
        { error: "Invalid person." },
        { status: 400 }
      );
    }

    if (!weekId) {
      return NextResponse.json(
        { error: "Week is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Check that the selected week exists.
    const { data: week, error: weekError } = await supabase
      .from("weeks")
      .select("id")
      .eq("id", weekId)
      .single();

    if (weekError || !week) {
      console.error(weekError);

      return NextResponse.json(
        { error: "Selected week does not exist." },
        { status: 400 }
      );
    }

    // Prevent duplicate contribution for the same person and week.
    const { data: existingPayment, error: existingError } =
      await supabase
        .from("payments")
        .select("id")
        .eq("person", person)
        .eq("week_id", weekId)
        .maybeSingle();

    if (existingError) {
      console.error(existingError);

      return NextResponse.json(
        { error: "Could not check existing contribution." },
        { status: 500 }
      );
    }

    if (existingPayment) {
      return NextResponse.json(
        {
          error: `${person} already has a contribution for this week.`,
        },
        { status: 409 }
      );
    }

    // Insert contribution.
    const { error: insertError } = await supabase
      .from("payments")
      .insert({
        person,
        week_id: weekId,
        amount,
      });

    if (insertError) {
      console.error(insertError);

      return NextResponse.json(
        { error: "Could not save contribution." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}