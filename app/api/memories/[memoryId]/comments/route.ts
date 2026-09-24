import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthenticated } from "@/lib/session/server";
import { sendNotificationToPerson } from "@/lib/notifications/send";

type RouteContext = {
  params: Promise<{
    memoryId: string;
  }>;
};

type Person = "Anantha" | "Farhan";

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const authenticated  = await isAuthenticated();

    if (!authenticated ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { memoryId } = await context.params;

    if (!memoryId) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: comments, error } = await supabase
      .from("memory_comments")
      .select(
        "id, memory_id, person, comment, created_at, updated_at",
      )
      .eq("memory_id", memoryId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch memory comments:", error);

      return NextResponse.json(
        { error: "Could not load comments." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      comments: comments ?? [],
    });
  } catch (error) {
    console.error("GET memory comments error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const authenticated  = await isAuthenticated();

    if (!authenticated ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { memoryId } = await context.params;

    if (!memoryId) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    const subscriptionEndpoint =
      typeof body.subscriptionEndpoint === "string"
        ? body.subscriptionEndpoint.trim()
        : "";

    if (!comment) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 },
      );
    }

    if (comment.length > 500) {
      return NextResponse.json(
        { error: "Comment must not exceed 500 characters." },
        { status: 400 },
      );
    }

    if (!subscriptionEndpoint) {
      return NextResponse.json(
        {
          error:
            "Notification device is required to identify the person.",
        },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // Pastikan memory memang ada
    const { data: memory, error: memoryError } = await supabase
      .from("memories")
      .select("id, person")
      .eq("id", memoryId)
      .single();

    if (memoryError || !memory) {
      return NextResponse.json(
        { error: "Memory not found." },
        { status: 404 },
      );
    }

    // Cari identitas berdasarkan subscription device
    const { data: device, error: deviceError } = await supabase
      .from("notification_devices")
      .select("person")
      .eq("endpoint", subscriptionEndpoint)
      .single();

    if (
      deviceError ||
      !device ||
      !["Anantha", "Farhan"].includes(device.person)
    ) {
      return NextResponse.json(
        {
          error:
            "This device is not registered for notifications.",
        },
        { status: 400 },
      );
    }

    const person = device.person as Person;

    // Simpan komentar
    const { data: newComment, error: insertError } = await supabase
      .from("memory_comments")
      .insert({
        memory_id: memoryId,
        person,
        comment,
      })
      .select(
        "id, memory_id, person, comment, created_at, updated_at",
      )
      .single();

    if (insertError) {
      console.error("Failed to create memory comment:", insertError);

      return NextResponse.json(
        { error: "Could not create comment." },
        { status: 500 },
      );
    }

    // ==========================================
    // SEND NOTIFICATION TO MEMORY OWNER
    // ==========================================

    const memoryOwner = memory.person as Person | null;

    if (memoryOwner && memoryOwner !== person) {
    try {
        await sendNotificationToPerson(memoryOwner, {
        title: "💬 HANAN Memory",
        body: `${person} mengomentari memory kamu: "${comment}"`,
        url: "/hanan-memory",
        });
    } catch (notificationError) {
        console.error(
        "Comment saved, but notification failed:",
        notificationError,
        );
    }
    }

    return NextResponse.json(
      {
        success: true,
        comment: newComment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST memory comment error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { memoryId } = await context.params;

    if (!memoryId) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const commentId =
      typeof body.commentId === "string"
        ? body.commentId.trim()
        : "";

    const subscriptionEndpoint =
      typeof body.subscriptionEndpoint === "string"
        ? body.subscriptionEndpoint.trim()
        : "";

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required." },
        { status: 400 },
      );
    }

    if (!subscriptionEndpoint) {
      return NextResponse.json(
        { error: "Notification device is required." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // Cari person berdasarkan device
    const { data: device, error: deviceError } = await supabase
      .from("notification_devices")
      .select("person")
      .eq("endpoint", subscriptionEndpoint)
      .single();

    if (
      deviceError ||
      !device ||
      !["Anantha", "Farhan"].includes(device.person)
    ) {
      return NextResponse.json(
        {
          error:
            "This device is not registered for notifications.",
        },
        { status: 400 },
      );
    }

    const person = device.person as Person;

    // Pastikan komentar memang milik person ini
    const { data: existingComment, error: commentError } =
      await supabase
        .from("memory_comments")
        .select("id, memory_id, person")
        .eq("id", commentId)
        .eq("memory_id", memoryId)
        .single();

    if (commentError || !existingComment) {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 },
      );
    }

    if (existingComment.person !== person) {
      return NextResponse.json(
        {
          error: "You can only delete your own comment.",
        },
        { status: 403 },
      );
    }

    // Hapus komentar
    const { error: deleteError } = await supabase
      .from("memory_comments")
      .delete()
      .eq("id", commentId)
      .eq("memory_id", memoryId)
      .eq("person", person);

    if (deleteError) {
      console.error(
        "Failed to delete memory comment:",
        deleteError,
      );

      return NextResponse.json(
        { error: "Could not delete comment." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE memory comment error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}