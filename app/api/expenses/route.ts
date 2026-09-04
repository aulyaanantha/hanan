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

    const amount = Number(body.amount);
    const expenseDate = body.expenseDate;
    const reason = String(body.reason ?? "").trim();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount." },
        { status: 400 }
      );
    }

    if (!expenseDate) {
      return NextResponse.json(
        { error: "Expense date is required." },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("hanan_expenses")
      .insert({
        amount,
        expense_date: expenseDate,
        reason,
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Could not save expense." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = body.id;
    const amount = Number(body.amount);
    const expenseDate = body.expenseDate;
    const reason = String(body.reason ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount." },
        { status: 400 }
      );
    }

    if (!expenseDate || !reason) {
      return NextResponse.json(
        { error: "Date and reason are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("hanan_expenses")
      .update({
        amount,
        expense_date: expenseDate,
        reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Could not update expense." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("hanan_expenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Could not delete expense." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}