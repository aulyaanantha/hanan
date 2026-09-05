import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ANNUAL_RATE = 0.025;

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("interest_records")
    .select(
      "id, interest_date, base_balance, annual_rate, interest_amount, created_at",
    )
    .order("interest_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({
      record: null,
      estimatedDailyInterest: 0,
      estimated30DayInterest: 0,
    });
  }

  const baseBalance = Number(data.base_balance);

  const estimatedDailyInterest =
    (baseBalance * ANNUAL_RATE) / 365;

  const estimated30DayInterest =
    estimatedDailyInterest * 30;

  return NextResponse.json({
    record: data,
    estimatedDailyInterest,
    estimated30DayInterest,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const balance = Number(body.balance);

    if (!Number.isFinite(balance) || balance < 0) {
      return NextResponse.json(
        { error: "Invalid balance." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const dailyInterest =
      (balance * ANNUAL_RATE) / 365;

    const { data, error } = await supabase
      .from("interest_records")
      .insert({
        interest_date: today,
        base_balance: balance,
        annual_rate: ANNUAL_RATE,
        interest_amount: dailyInterest,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      record: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }
}