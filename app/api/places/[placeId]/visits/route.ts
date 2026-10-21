
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ placeId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { placeId } = await params;
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("place_visits")
      .select("*")
      .eq("place_id", placeId)
      .order("visited_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil kunjungan:", error);
      return NextResponse.json(
        { error: "Gagal mengambil cerita kunjungan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ visits: data });
  } catch (error) {
    console.error("Visits GET error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { placeId } = await params;
    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const story =
      typeof body.story === "string" ? body.story.trim() : "";

    const visitedAt =
      typeof body.visited_at === "string" ? body.visited_at : "";

    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "Judul wajib diisi dan maksimal 200 karakter." },
        { status: 400 }
      );
    }

    if (story.length > 10000) {
      return NextResponse.json(
        { error: "Cerita maksimal 10.000 karakter." },
        { status: 400 }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(visitedAt) ||
      !Number.isFinite(Date.parse(`${visitedAt}T00:00:00Z`)) ||
      new Date(`${visitedAt}T00:00:00Z`).toISOString().slice(0, 10) !== visitedAt
    ) {
      return NextResponse.json(
        { error: "Tanggal kunjungan tidak valid." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: place, error: placeError } = await supabase
      .from("memory_places")
      .select("id")
      .eq("id", placeId)
      .maybeSingle();

    if (placeError) {
      console.error("Gagal memeriksa tempat:", placeError);
      return NextResponse.json(
        { error: "Gagal memeriksa tempat." },
        { status: 500 }
      );
    }

    if (!place) {
      return NextResponse.json(
        { error: "Tempat tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("place_visits")
      .insert({
        place_id: placeId,
        title,
        story,
        visited_at: visitedAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Gagal menyimpan kunjungan:", error);
      return NextResponse.json(
        { error: "Cerita kunjungan gagal disimpan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ visit: data }, { status: 201 });
  } catch (error) {
    console.error("Visits POST error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan kunjungan." },
      { status: 500 }
    );
  }
}
