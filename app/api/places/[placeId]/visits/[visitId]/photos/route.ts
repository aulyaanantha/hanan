
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET_NAME = "hanan-place-photos";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type RouteContext = {
  params: Promise<{
    placeId: string;
    visitId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const { placeId, visitId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const captionValue = formData.get("caption");
    const takenAtValue = formData.get("taken_at");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please select a photo to upload." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The photo must not exceed 10 MB." },
        { status: 400 }
      );
    }

    const caption =
      typeof captionValue === "string"
        ? captionValue.trim()
        : "";

    if (caption.length > 500) {
      return NextResponse.json(
        { error: "The caption must not exceed 500 characters." },
        { status: 400 }
      );
    }

    let takenAt: string | null = null;

    if (typeof takenAtValue === "string" && takenAtValue.trim()) {
      const date = takenAtValue.trim();

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      ) {
        return NextResponse.json(
          { error: "The photo date is invalid." },
          { status: 400 }
        );
      }

      takenAt = date;
    }

    const supabase = createSupabaseServerClient();

    const { data: visit, error: visitError } = await supabase
      .from("place_visits")
      .select("id, place_id")
      .eq("id", visitId)
      .eq("place_id", placeId)
      .maybeSingle();

    if (visitError) {
      console.error("Failed to verify visit:", visitError);

      return NextResponse.json(
        { error: "Failed to verify the selected memory." },
        { status: 500 }
      );
    }

    if (!visit) {
      return NextResponse.json(
        { error: "The selected memory was not found." },
        { status: 404 }
      );
    }

    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const fileExtension = extensionByType[file.type];
    const storagePath =
      `${placeId}/${visitId}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload failed:", uploadError);

      return NextResponse.json(
        { error: "Failed to upload the photo." },
        { status: 500 }
      );
    }

    const { data: photo, error: photoError } = await supabase
      .from("place_photos")
      .insert({
        visit_id: visitId,
        storage_path: storagePath,
        caption: caption || null,
        taken_at: takenAt,
      })
      .select()
      .single();

    if (photoError) {
      console.error("Failed to save photo metadata:", photoError);

      const { error: cleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (cleanupError) {
        console.error("Failed to clean up uploaded photo:", cleanupError);
      }

      return NextResponse.json(
        { error: "The photo was uploaded but its details could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Photo upload API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while uploading the photo." },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const { placeId, visitId } = await params;
    const supabase = createSupabaseServerClient();

    const { data: visit, error: visitError } = await supabase
      .from("place_visits")
      .select("id")
      .eq("id", visitId)
      .eq("place_id", placeId)
      .maybeSingle();

    if (visitError) {
      console.error("Failed to verify visit:", visitError);

      return NextResponse.json(
        { error: "Failed to verify the selected memory." },
        { status: 500 }
      );
    }

    if (!visit) {
      return NextResponse.json(
        { error: "The selected memory was not found." },
        { status: 404 }
      );
    }

    const { data: photos, error: photosError } = await supabase
      .from("place_photos")
      .select("*")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: false });

    if (photosError) {
      console.error("Failed to fetch photos:", photosError);

      return NextResponse.json(
        { error: "Failed to load memory photos." },
        { status: 500 }
      );
    }

    const photosWithUrls = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(photo.storage_path, 3600);

        if (error) {
          console.error("Failed to create photo URL:", error);
        }

        return {
          ...photo,
          url: error ? null : data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json(
      { photos: photosWithUrls },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Photo GET API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while loading photos." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      placeId: string;
      visitId: string;
    }>;
  }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return Response.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { placeId, visitId } = await context.params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return Response.json(
        { error: "Photo ID is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Verify that the visit belongs to the selected place.
    const { data: visit, error: visitError } = await supabase
      .from("place_visits")
      .select("id, place_id")
      .eq("id", visitId)
      .eq("place_id", placeId)
      .maybeSingle();

    if (visitError) {
      throw visitError;
    }

    if (!visit) {
      return Response.json(
        { error: "Visit not found." },
        { status: 404 }
      );
    }

    // Find the photo belonging to this visit.
    const { data: photo, error: photoError } = await supabase
      .from("place_photos")
      .select("id, visit_id, storage_path")
      .eq("id", photoId)
      .eq("visit_id", visitId)
      .maybeSingle();

    if (photoError) {
      throw photoError;
    }

    if (!photo) {
      return Response.json(
        { error: "Photo not found." },
        { status: 404 }
      );
    }

    // Remove the file from private Supabase Storage first.
    const { error: storageError } = await supabase.storage
      .from("hanan-place-photos")
      .remove([photo.storage_path]);

    if (storageError) {
      throw storageError;
    }

    // Remove the photo metadata from the database.
    const { error: deleteError } = await supabase
      .from("place_photos")
      .delete()
      .eq("id", photoId)
      .eq("visit_id", visitId);

    if (deleteError) {
      console.error(
        "Photo metadata deletion failed:",
        deleteError
      );

      return Response.json(
        {
          error:
            "The photo file was removed, but its database record could not be deleted. Please check the database.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Photo deleted successfully.",
    });
  } catch (error) {
    console.error("Photo deletion error:", error);

    return Response.json(
      { error: "Failed to delete photo." },
      { status: 500 }
    );
  }
}
