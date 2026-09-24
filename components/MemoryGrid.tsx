"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Pencil, Trash2, X } from "lucide-react";
import EditMemoryModal from "@/components/EditMemoryModal";
import MemoryComments from "@/components/MemoryComments";

type Memory = {
  id: string;
  image_path: string;
  image_url: string;
  note: string;
  memory_date: string;
  created_at: string;
  updated_at: string;
  person?: "Anantha" | "Farhan" | null;
};

type MemoryGridProps = {
  initialMemories: Memory[];
  selectedMemoryFromOutside?: Memory | null;
  onClearExternalSelection?: () => void;
};

function getMonthYear(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function groupMemoriesByMonth(memories: Memory[]) {
  return memories.reduce(
    (groups, memory) => {
      const key = getMonthYear(memory.memory_date);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(memory);

      return groups;
    },
    {} as Record<string, Memory[]>,
  );
}

function formatMemoryDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function MemoryGrid({ initialMemories }: MemoryGridProps) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories);

  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setMemories(initialMemories);
  }, [initialMemories]);

  // ==========================================
  // CLOSE DETAIL
  // ==========================================

  function closeDetail() {
    setSelectedMemory(null);
  }

  // ==========================================
  // DELETE
  // ==========================================

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this memory?",
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      const response = await fetch("/api/memories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to delete memory.");
        return;
      }

      setMemories((current) => current.filter((memory) => memory.id !== id));

      setSelectedMemory(null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (memories.length === 0) {
    return (
      <div className="soft-card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl soft-card-inset">
          <CalendarDays className="h-7 w-7 text-indigo-400" />
        </div>

        <h3 className="text-lg font-semibold text-slate-700">
          No memories yet
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Start saving little moments from your journey together.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ==========================================
    MEMORY GRID
========================================== */}

      <div className="space-y-10">
        {Object.entries(groupMemoriesByMonth(memories)).map(
          ([monthYear, monthMemories]) => (
            <section key={monthYear}>
              {/* MONTH HEADER */}

              <div className="mb-5 flex items-center gap-4">
                <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-700">
                  {monthYear}
                </h2>

                <div className="h-px flex-1 bg-slate-200/70" />

                <span className="hidden whitespace-nowrap text-xs font-medium text-slate-400 sm:block">
                  {monthMemories.length}{" "}
                  {monthMemories.length === 1 ? "memory" : "memories"}
                </span>
              </div>

              {/* MEMORY CARDS */}

              <div className="grid grid-cols-3 gap-3 lg:grid-cols-4 lg:gap-5">
                {monthMemories.map((memory) => (
                  <article
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className="group cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-[6px_6px_14px_rgba(148,163,184,0.18),-6px_-6px_14px_rgba(255,255,255,0.8)] transition duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_18px_rgba(148,163,184,0.22),-8px_-8px_18px_rgba(255,255,255,0.9)]"
                  >
                    {/* IMAGE */}

                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={memory.image_url}
                        alt={memory.note || "HANAN Memory"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      {/* IMAGE OVERLAY */}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                      {/* DATE ON HOVER */}

                      <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:opacity-100">
                        {formatMemoryDate(memory.memory_date)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      {/* ==========================================
          MEMORY DETAIL
      ========================================== */}

      {selectedMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
          onClick={closeDetail}
        >
          <div
            className="relative flex max-h-[90vh] w-[94vw] max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl lg:flex-row"
            onClick={(event) => event.stopPropagation()}
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={closeDetail}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-500 shadow-lg backdrop-blur transition hover:text-slate-700 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              aria-label="Close memory"
            >
              <X className="h-5 w-5" />
            </button>

            {/* IMAGE */}

            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-900">
              <img
                src={selectedMemory.image_url}
                alt={selectedMemory.note || "HANAN Memory"}
                className="max-h-[28vh] w-full object-contain sm:max-h-[45vh] lg:max-h-[92vh]"
              />
            </div>

            {/* INFO */}

            <div className="flex min-h-0 w-full flex-col lg:w-[400px]">
              {/* FIXED: MEMORY INFO */}

              <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-7 lg:pt-7">
                {/* DATE */}

                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  <CalendarDays className="h-4 w-4" />

                  {formatMemoryDate(selectedMemory.memory_date)}
                </p>

                {/* PERSON */}

                {selectedMemory.person && (
                  <p className="mt-2 text-xs font-medium text-slate-400">
                    Memory by {selectedMemory.person}
                  </p>
                )}

                {/* NOTE */}

                {selectedMemory.note ? (
                  <p className="mt-4 whitespace-pre-wrap text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                    {selectedMemory.note}
                  </p>
                ) : (
                  <p className="mt-4 text-xs italic text-slate-400 sm:text-sm">
                    No note for this memory.
                  </p>
                )}
              </div>

              {/* SCROLL ONLY COMMENTS */}

              <div className="min-h-0 flex-1 overflow-hidden px-4 sm:px-6 lg:px-7">
                <div className="mt-4 h-full border-t border-slate-200/70 pt-3">
                  <h3 className="shrink-0 text-xs font-bold text-slate-600">
                    💬 Comments
                  </h3>

                  <div className="mt-2 h-[180px] overflow-y-auto pr-1 sm:h-[220px]">
                    <MemoryComments memoryId={selectedMemory.id} />
                  </div>
                </div>
              </div>

              {/* FIXED: ACTIONS */}

              <div className="shrink-0 border-t border-slate-200/70 px-4 py-3 sm:px-6 sm:py-4 lg:px-7">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemory(selectedMemory);
                      setSelectedMemory(null);
                    }}
                    className="soft-button flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-500 sm:py-3 sm:text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedMemory.id)}
                    disabled={deletingId === selectedMemory.id}
                    className="soft-button flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-slate-500 transition hover:text-rose-500 disabled:opacity-50 sm:py-3 sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />

                    {deletingId === selectedMemory.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <EditMemoryModal
        memory={editingMemory}
        onClose={() => setEditingMemory(null)}
        onSuccess={(updatedMemory) => {
          setMemories((current) =>
            [
              ...current.map((memory) =>
                memory.id === updatedMemory.id ? updatedMemory : memory,
              ),
            ].sort((a, b) => {
              const dateA = new Date(a.memory_date).getTime();
              const dateB = new Date(b.memory_date).getTime();

              if (dateA !== dateB) {
                return dateB - dateA;
              }

              return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
              );
            }),
          );

          setEditingMemory(null);
        }}
      />
    </>
  );
}
