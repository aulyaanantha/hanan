import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TransactionType = "deposit" | "withdrawal";

function isValidType(type: unknown): type is TransactionType {
  return type === "deposit" || type === "withdrawal";
}

function isValidAmount(amount: unknown) {
  const numericAmount = Number(amount);

  return (
    Number.isFinite(numericAmount) &&
    numericAmount > 0
  );
}

function isValidDate(date: unknown) {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  );
}

/* =========================
   ADD TRANSACTION
========================= */

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      type,
      amount,
      transactionDate,
      note,
    } = body;

    if (!isValidType(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (!isValidAmount(amount)) {
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 }
      );
    }

    if (!isValidDate(transactionDate)) {
      return NextResponse.json(
        { error: "Invalid transaction date." },
        { status: 400 }
      );
    }

    const supabase =
      createSupabaseServerClient();

    const { data, error } = await supabase
      .from("personal_savings")
      .insert({
        type,
        amount: Number(amount),
        transaction_date: transactionDate,
        note:
            typeof note === "string"
            ? note.trim()
            : "",
        })
      .select()
      .single();

    if (error) {
      console.error(
        "Personal savings insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to add personal savings transaction.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Personal savings POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to add personal savings transaction.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   EDIT TRANSACTION
========================= */

export async function PATCH(request: Request) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      transactionId,
      type,
      amount,
      transactionDate,
      note,
    } = body;

    if (
      typeof transactionId !== "string" ||
      transactionId.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Transaction ID is required." },
        { status: 400 }
      );
    }

    if (!isValidType(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (!isValidAmount(amount)) {
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 }
      );
    }

    if (!isValidDate(transactionDate)) {
      return NextResponse.json(
        { error: "Invalid transaction date." },
        { status: 400 }
      );
    }

    const supabase =
      createSupabaseServerClient();

    const { data: existingTransaction, error: findError } =
      await supabase
        .from("personal_savings")
        .select("id")
        .eq("id", transactionId)
        .maybeSingle();

    if (findError) {
      console.error(
        "Personal savings lookup error:",
        findError
      );

      return NextResponse.json(
        {
          error:
            "Failed to find personal savings transaction.",
        },
        { status: 500 }
      );
    }

    if (!existingTransaction) {
      return NextResponse.json(
        {
          error:
            "Personal savings transaction not found.",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("personal_savings")
        .update({
            type,
            amount: Number(amount),
            transaction_date: transactionDate,
            note:
                typeof note === "string"
                ? note.trim()
                : "",
            updated_at: new Date().toISOString(),
        })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      console.error(
        "Personal savings update error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to update personal savings transaction.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(
      "Personal savings PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update personal savings transaction.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE TRANSACTION
========================= */

export async function DELETE(request: Request) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const { transactionId } = body;

    if (
      typeof transactionId !== "string" ||
      transactionId.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Transaction ID is required." },
        { status: 400 }
      );
    }

    const supabase =
      createSupabaseServerClient();

    const { data: existingTransaction, error: findError } =
      await supabase
        .from("personal_savings")
        .select("id")
        .eq("id", transactionId)
        .maybeSingle();

    if (findError) {
      console.error(
        "Personal savings lookup error:",
        findError
      );

      return NextResponse.json(
        {
          error:
            "Failed to find personal savings transaction.",
        },
        { status: 500 }
      );
    }

    if (!existingTransaction) {
      return NextResponse.json(
        {
          error:
            "Personal savings transaction not found.",
        },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("personal_savings")
      .delete()
      .eq("id", transactionId);

    if (error) {
      console.error(
        "Personal savings delete error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to delete personal savings transaction.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Personal savings DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete personal savings transaction.",
      },
      { status: 500 }
    );
  }
}