"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

type Person = "Anantha" | "Farhan";

type Comment = {
  id: string;
  memory_id: string;
  person: Person;
  comment: string;
  created_at: string;
  updated_at: string;
};

type MemoryCommentsProps = {
  memoryId: string;
};

function formatCommentDate(dateString: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function MemoryComments({ memoryId }: MemoryCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    loadCurrentPerson();
  }, [memoryId]);

  async function loadCurrentPerson() {
    try {
      if (!("serviceWorker" in navigator)) {
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return;
      }

      const response = await fetch("/api/notifications/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.person === "Anantha" || data.person === "Farhan") {
        setCurrentPerson(data.person);
      }
    } catch (error) {
      console.error("Failed to load current person:", error);
    }
  }

  async function loadComments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/memories/${memoryId}/comments`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat komentar.");
      }

      setComments(data.comments ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Gagal memuat komentar.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function getSubscriptionEndpoint() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Browser ini belum mendukung Service Worker.");
    }

    if (!("PushManager" in window)) {
      throw new Error("Browser ini belum mendukung Push Notification.");
    }

    // Gunakan service worker yang sama dengan NotificationSetup
    const registration = await navigator.serviceWorker.register("/sw.js");

    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      throw new Error(
        "Notification device belum terdaftar. Silakan aktifkan notification terlebih dahulu.",
      );
    }

    return subscription.endpoint;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedComment = comment.trim();

    if (!trimmedComment || sending) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const subscriptionEndpoint = await getSubscriptionEndpoint();

      const response = await fetch(`/api/memories/${memoryId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: trimmedComment,
          subscriptionEndpoint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim komentar.");
      }

      setComments((current) => [...current, data.comment]);

      setComment("");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Gagal mengirim komentar.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (deletingId) {
      return;
    }

    try {
      setDeletingId(commentId);
      setError("");

      const subscriptionEndpoint = await getSubscriptionEndpoint();

      const response = await fetch(`/api/memories/${memoryId}/comments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          subscriptionEndpoint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus komentar.");
      }

      setComments((current) => current.filter((item) => item.id !== commentId));
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Gagal menghapus komentar.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {/* COMMENTS LIST */}

      <div className="space-y-1.5 pr-1">
        {loading ? (
          <p className="text-sm text-slate-400">Memuat komentar...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada komentar 💗</p>
        ) : (
          comments.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-slate-50 px-3 py-2 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-xs font-semibold text-slate-600">
                    {item.person}
                  </span>

                  {currentPerson === item.person && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(item.id)}
                      disabled={deletingId === item.id}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-rose-50 hover:text-rose-400 disabled:opacity-50"
                      title="Hapus komentar"
                      aria-label="Hapus komentar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <span className="shrink-0 text-[10px] text-slate-400">
                  {formatCommentDate(item.created_at)}
                </span>
              </div>

              <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                {item.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3">
          <p className="text-xs font-semibold text-rose-400">{error}</p>
        </div>
      )}

      {/* INPUT */}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          placeholder="Tulis komentar..."
          disabled={sending}
          className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 shadow-[inset_3px_3px_7px_rgba(148,163,184,0.12),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={sending || !comment.trim()}
          className="rounded-xl bg-indigo-400 px-3 py-2.5 text-xs font-semibold text-white shadow-[4px_4px_10px_rgba(129,140,248,0.25)] transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}
