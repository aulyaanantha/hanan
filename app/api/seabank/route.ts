import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ANNUAL_RATE = 0.025;
const DAY_MS = 1000 * 60 * 60 * 24;

function getJakartaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function calculateDaysBetween(
  startDate: string,
  endDate: string,
) {
  const start = new Date(`${startDate}T00:00:00+07:00`);
  const end = new Date(`${endDate}T00:00:00+07:00`);

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / DAY_MS),
  );
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data: records, error } = await supabase
      .from("interest_records")
      .select(
        "id, interest_date, base_balance, annual_rate, interest_amount, accumulated_interest, created_at",
      )
      .order("interest_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    const latestRecord = records?.[0];

    if (!latestRecord) {
      return NextResponse.json({
        record: null,
        interestEarnedSoFar: 0,
        estimatedDailyInterest: 0,
        estimated30DayInterest: 0,
        interestDays: 0,
      });
    }

    const today = getJakartaDate();

    const baseBalance = Number(latestRecord.base_balance);
    const annualRate = Number(latestRecord.annual_rate);

    const accumulatedInterest = Number(
      latestRecord.accumulated_interest ?? 0,
    );

    const interestDays = calculateDaysBetween(
      latestRecord.interest_date,
      today,
    );

    const estimatedDailyInterest =
      (baseBalance * annualRate) / 365;

    const additionalInterest =
      estimatedDailyInterest * interestDays;

    const interestEarnedSoFar =
      accumulatedInterest + additionalInterest;

    const estimated30DayInterest =
      estimatedDailyInterest * 30;

    return NextResponse.json({
      record: latestRecord,
      interestEarnedSoFar,
      estimatedDailyInterest,
      estimated30DayInterest,
      interestDays,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
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

    const today = getJakartaDate();

    /*
     * Find the latest recorded balance.
     */
    const { data: latestRecord, error: latestError } =
      await supabase
        .from("interest_records")
        .select(
          "id, interest_date, base_balance, annual_rate, accumulated_interest",
        )
        .order("interest_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestError) {
      return NextResponse.json(
        { error: latestError.message },
        { status: 500 },
      );
    }

    let accumulatedInterest = 0;

    if (latestRecord) {
      const previousBalance = Number(
        latestRecord.base_balance,
      );

      const previousRate = Number(
        latestRecord.annual_rate,
      );

      const previousAccumulatedInterest = Number(
        latestRecord.accumulated_interest ?? 0,
      );

      const daysPassed = calculateDaysBetween(
        latestRecord.interest_date,
        today,
      );

      const previousDailyInterest =
        (previousBalance * previousRate) / 365;

      accumulatedInterest =
        previousAccumulatedInterest +
        previousDailyInterest * daysPassed;
    }

    const dailyInterest =
      (balance * ANNUAL_RATE) / 365;

    const { data, error } = await supabase
      .from("interest_records")
      .upsert(
        {
          interest_date: today,
          base_balance: balance,
          annual_rate: ANNUAL_RATE,
          interest_amount: dailyInterest,
          accumulated_interest: accumulatedInterest,
        },
        {
          onConflict: "interest_date",
        },
      )
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