
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("memory_places")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil tempat:", error);
      return NextResponse.json(
        { error: "Gagal mengambil daftar tempat." },
        { status: 500 }
      );
    }

    return NextResponse.json({ places: data });
  } catch (error) {
    console.error("Places GET error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const googlePlaceId =
      typeof body.google_place_id === "string"
        ? body.google_place_id.trim()
        : "";

    const placeName =
      typeof body.place_name === "string"
        ? body.place_name.trim()
        : "";

    const address =
      typeof body.formatted_address === "string"
        ? body.formatted_address.trim()
        : "";

    const latitude = body.latitude;
    const longitude = body.longitude;

    const allowedCategories = [
      "photobox",
      "cafe",
      "food",
      "travel",
      "shopping",
      "other",
    ];

    const category = allowedCategories.includes(body.category)
      ? body.category
      : "other";

    const customName =
      typeof body.custom_name === "string"
        ? body.custom_name.trim()
        : null;

    if (
      !googlePlaceId ||
      !placeName ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Data tempat tidak valid." },
        { status: 400 }
      );
    }

    if (
      googlePlaceId.length > 300 ||
      placeName.length > 300 ||
      address.length > 1000 ||
      (customName && customName.length > 200)
    ) {
      return NextResponse.json(
        { error: "Ada data tempat yang terlalu panjang." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("memory_places")
      .upsert(
        {
          google_place_id: googlePlaceId,
          place_name: placeName,
          custom_name: customName || null,
          formatted_address: address || null,
          latitude,
          longitude,
          category,
        },
        { onConflict: "google_place_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Gagal menyimpan tempat:", error);
      return NextResponse.json(
        { error: "Tempat gagal disimpan ke database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ place: data }, { status: 200 });
  } catch (error) {
    console.error("Places POST error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan tempat." },
      { status: 500 }
    );
  }
}
