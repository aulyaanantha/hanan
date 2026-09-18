import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET_NAME = "memory-images";

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("memory_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/memories error:", error);

      return NextResponse.json(
        { error: "Failed to fetch memories" },
        { status: 500 }
      );
    }

    const memories = (data ?? []).map((memory) => {
      const {
        data: { publicUrl },
      } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(memory.image_path);

      return {
        ...memory,
        image_url: publicUrl,
      };
    });

    return NextResponse.json(memories);
  } catch (error) {
    console.error("GET /api/memories unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const note = formData.get("note");
    const memoryDate = formData.get("memory_date");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    if (!memoryDate || typeof memoryDate !== "string") {
      return NextResponse.json(
        { error: "Memory date is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const fileExtension =
      image.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    const date = new Date(`${memoryDate}T00:00:00`);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const filePath = `memories/${year}/${month}/${fileName}`;

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBuffer, {
        contentType: image.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Memory image upload error:", uploadError);

      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    const { data, error: insertError } = await supabase
      .from("memories")
      .insert({
        image_path: filePath,
        note: typeof note === "string" ? note : "",
        memory_date: memoryDate,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Memory insert error:", insertError);

      // Hapus foto jika database gagal menyimpan
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      return NextResponse.json(
        { error: "Failed to save memory" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json(
      {
        ...data,
        image_url: publicUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/memories unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      note,
      memory_date,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required" },
        { status: 400 }
      );
    }

    const updates: {
      note?: string;
      memory_date?: string;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof note === "string") {
      updates.note = note;
    }

    if (typeof memory_date === "string") {
      updates.memory_date = memory_date;
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("memories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Memory update error:", error);

      return NextResponse.json(
        { error: "Failed to update memory" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.image_path);

    return NextResponse.json({
      ...data,
      image_url: publicUrl,
    });
  } catch (error) {
    console.error("PATCH /api/memories unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Ambil data memory terlebih dahulu
    const { data: memory, error: findError } = await supabase
      .from("memories")
      .select("image_path")
      .eq("id", id)
      .single();

    if (findError || !memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404 }
      );
    }

    // Hapus foto dari Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([memory.image_path]);

    if (storageError) {
      console.error("Memory image delete error:", storageError);

      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    // Hapus data dari database
    const { error: deleteError } = await supabase
      .from("memories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Memory database delete error:", deleteError);

      return NextResponse.json(
        { error: "Failed to delete memory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/memories unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}