"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, MessageCircle, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import EditMemoryModal from "@/components/EditMemoryModal";
import MemoryComments from "@/components/MemoryComments";
import MemoryGalleryEffects from "@/components/MemoryGalleryEffects";
import { getAdjacentMemory, getMemorySwipeDirection } from "@/lib/memory-navigation";

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
  const [previousMemories, setPreviousMemories] = useState(initialMemories);
  const panel = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'next' | 'previous'>('next');
  const isDetailOpen = selectedMemory !== null;

  if (previousMemories !== initialMemories) {
    setPreviousMemories(initialMemories);
    setMemories(initialMemories);
  }

  const moveSelection = useCallback((direction: -1 | 1) => {
    setSwipeDirection(direction === 1 ? 'next' : 'previous');
    setSelectedMemory(current => current ? getAdjacentMemory(memories, current.id, direction) ?? current : null);
  }, [memories]);

  useEffect(() => {
    if (!isDetailOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLButtonElement>('[aria-label="Close memory"]')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setSelectedMemory(null); return; }
      if (event.key === 'Tab') {
        const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        return;
      }
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); moveSelection(event.key === 'ArrowRight' ? 1 : -1);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isDetailOpen, moveSelection]);

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
          <CalendarDays className="h-7 w-7 text-[var(--primary)]" />
        </div>

        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          No memories yet
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
          Start saving little moments from your journey together.
        </p>
      </div>
    );
  }

  return (
    <>
      <MemoryGalleryEffects memoryIds={memories.map(memory => memory.id).join(',')} />
      {/* ==========================================
    MEMORY GRID
========================================== */}

      <div className="space-y-10">
        {Object.entries(groupMemoriesByMonth(memories)).map(
          ([monthYear, monthMemories]) => (
            <section key={monthYear}>
              {/* MONTH HEADER */}

              <div className="mb-5 flex items-center gap-4">
                <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-[var(--foreground)]">
                  {monthYear}
                </h2>

                <div className="h-px flex-1 bg-slate-200/70" />

                <span className="hidden whitespace-nowrap text-xs font-medium text-[var(--muted)] sm:block">
                  {monthMemories.length}{" "}
                  {monthMemories.length === 1 ? "memory" : "memories"}
                </span>
              </div>

              {/* MEMORY CARDS */}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {monthMemories.map((memory, index) => (
                  <article
                    key={memory.id}
                    data-memory-card={memory.id}
                    data-memory-order={index % 4}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open memory: ${memory.note || formatMemoryDate(memory.memory_date)}`}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedMemory(memory); } }}
                    onClick={() => setSelectedMemory(memory)}
                    className="memory-gallery-card group cursor-pointer overflow-hidden rounded-2xl bg-slate-100 shadow-[6px_6px_14px_rgba(--shadow-dark),-6px_-6px_14px_rgba(--shadow-light)] transition duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_18px_rgba(--shadow-dark),-8px_-8px_18px_rgba(--shadow-light)]"
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

                      <div className="absolute bottom-3 left-3 rounded-xl bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:opacity-100">
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
          className="memory-detail-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[var(--surface)]/60 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
          onClick={closeDetail}
        >
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Memory details"
            data-direction={swipeDirection}
            className="memory-detail-panel relative flex max-h-[90vh] w-[94vw] max-w-5xl flex-col overflow-hidden rounded-3xl bg-[var(--surface-raised)] shadow-2xl lg:flex-row"
            onClick={(event) => event.stopPropagation()}
          >
            {/* CLOSE */}

            <button
              type="button"
              onClick={closeDetail}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)]/90 text-[var(--muted)] shadow-lg backdrop-blur transition hover:text-[var(--foreground)] sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              aria-label="Close memory"
            >
              <X className="h-5 w-5" />
            </button>

            {/* IMAGE */}

            <div className="memory-detail-photo relative flex min-h-0 flex-1 items-center justify-center bg-slate-900"
              onPointerDown={(event) => {
                if (!event.isPrimary || (event.target as HTMLElement).closest('button')) { swipeStart.current = null; return; }
                swipeStart.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerUp={(event) => {
                const start = swipeStart.current; swipeStart.current = null;
                if (!start || (event.target as HTMLElement).closest('button')) return;
                const direction = getMemorySwipeDirection(event.clientX - start.x, event.clientY - start.y);
                if (direction) moveSelection(direction);
              }}
              onPointerCancel={() => { swipeStart.current = null; }}>
              <img
                key={selectedMemory.id}
                draggable={false}
                src={selectedMemory.image_url}
                alt={selectedMemory.note || "HANAN Memory"}
                className="memory-detail-image max-h-[28vh] w-full object-contain sm:max-h-[45vh] lg:max-h-[92vh]"
              />
              <button type="button" className="memory-photo-previous" disabled={!getAdjacentMemory(memories, selectedMemory.id, -1)} aria-label="Previous memory" onClick={() => moveSelection(-1)}><ChevronLeft size={20} /></button>
              <button type="button" className="memory-photo-next" disabled={!getAdjacentMemory(memories, selectedMemory.id, 1)} aria-label="Next memory" onClick={() => moveSelection(1)}><ChevronRight size={20} /></button>
            </div>

            {/* INFO */}

            <div className="flex min-h-0 w-full flex-col lg:w-[400px]">
              {/* FIXED: MEMORY INFO */}

              <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-7 lg:pt-7">
                {/* DATE */}

                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                  <CalendarDays className="h-4 w-4" />

                  {formatMemoryDate(selectedMemory.memory_date)}
                </p>

                {/* PERSON */}


                {selectedMemory.person && (
                  <div className="mt-3 flex items-center gap-2">
                    <img
                      src={
                        selectedMemory.person === "Anantha"
                          ? "/images/anantha.jpg"
                          : "/images/farhan.jpg"
                      }
                      alt={selectedMemory.person}
                      className="h-7 w-7 shrink-0 rounded-full object-cover ring-2 ring-[var(--surface-raised)]"
                    />

                    <p className="text-xs font-medium text-[var(--muted)]">
                      Memory by{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {selectedMemory.person}
                      </span>
                    </p>
                  </div>
                )}


                {/* NOTE */}

                {selectedMemory.note ? (
                  <p className="mt-4 whitespace-pre-wrap text-xs leading-5 text-[var(--foreground)] sm:text-sm sm:leading-6">
                    {selectedMemory.note}
                  </p>
                ) : (
                  <p className="mt-4 text-xs italic text-[var(--muted)] sm:text-sm">
                    No note for this memory.
                  </p>
                )}
              </div>

              {/* SCROLL ONLY COMMENTS */}

              <div className="min-h-0 flex-1 overflow-hidden px-4 sm:px-6 lg:px-7">
                <div className="mt-4 h-full border-t border-slate-200/70 pt-3">

                  <h3 className="flex shrink-0 items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                    <MessageCircle
                      className="h-4 w-4 text-[var(--primary)]"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    Comments
                  </h3>

                  <div className="mt-2 h-[180px] overflow-y-auto pr-1 sm:h-[220px]">
                    <MemoryComments key={selectedMemory.id} memoryId={selectedMemory.id} />
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
                    className="mobile-round-action soft-button flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--primary)] sm:py-3 sm:text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="max-md:sr-only">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedMemory.id)}
                    disabled={deletingId === selectedMemory.id}
                    className="mobile-round-action soft-button flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-[var(--muted)] transition hover:text-rose-500 disabled:opacity-50 sm:py-3 sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />

                    <span className="max-md:sr-only">{deletingId === selectedMemory.id
                      ? "Deleting..."
                      : "Delete"}</span>
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
