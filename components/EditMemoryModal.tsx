"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";

type Memory = {
  id: string;
  image_path: string;
  image_url: string;
  note: string;
  memory_date: string;
  created_at: string;
  updated_at: string;
};

type EditMemoryModalProps = {
  memory: Memory | null;
  onClose: () => void;
  onSuccess: (updatedMemory: Memory) => void;
};

export default function EditMemoryModal({
  memory,
  onClose,
  onSuccess,
}: EditMemoryModalProps) {
  const [note, setNote] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (memory) {
      setNote(memory.note || "");
      setMemoryDate(memory.memory_date);
    }
  }, [memory]);

  if (!memory) return null;

  async function handleSave() {
    if (!memory) {
      return;
    }

    if (!memoryDate) {
      alert("Please select a date.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/memories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: memory.id,
          note,
          memory_date: memoryDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update memory.");
      }

      onSuccess(result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error ? error.message : "Failed to update memory.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay)] px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="soft-card w-full max-w-lg overflow-hidden rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Edit Memory</h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Update the details of this moment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PHOTO */}

        <div className="mx-5 overflow-hidden rounded-2xl sm:mx-6">
          <img
            src={memory.image_url}
            alt={memory.note || "HANAN Memory"}
            className="aspect-[16/8] w-full object-cover"
          />
        </div>

        {/* FORM */}

        <div className="px-5 pb-6 pt-5 sm:px-6">
          {/* DATE */}

          <div>
            <label className="text-xs font-bold tracking-wider text-[var(--muted)]">
              DATE
            </label>

            <div className="soft-card-inset mt-2 flex items-center rounded-xl px-4">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--primary)]" />

              <input
                type="date"
                value={memoryDate}
                onChange={(event) => setMemoryDate(event.target.value)}
                className="w-full bg-transparent py-3 pl-3 text-sm font-semibold text-[var(--foreground)] outline-none"
              />
            </div>
          </div>

          {/* NOTE */}

          <div className="mt-5">
            <label className="text-xs font-bold tracking-wider text-[var(--muted)]">
              NOTE
            </label>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="What happened in this moment?"
              className="soft-card-inset mt-2 w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>

          {/* ACTIONS */}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="soft-button flex-1 rounded-xl py-3 text-sm font-semibold text-[var(--muted)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="soft-button flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-[var(--primary)] disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}

              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
