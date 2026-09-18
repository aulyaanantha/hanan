"use client";

import { CalendarDays, Heart } from "lucide-react";

type Memory = {
  id: string;
  image_url: string;
  note: string;
  memory_date: string;
};

type OnThisDayProps = {
  memories: Memory[];
};

function formatMemoryDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getYear(date: string) {
  return new Date(`${date}T00:00:00`).getFullYear();
}

export default function OnThisDay({
  memories,
}: OnThisDayProps) {
  if (memories.length === 0) {
    return null;
  }

  return (
    <section className="mb-7">
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 fill-pink-300 text-pink-300" />

        <div>
          <h2 className="text-lg font-bold text-slate-700">
            On This Day
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Little moments from this day in the past.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-4 lg:gap-5">
        {memories.map((memory) => (
          <article
            key={memory.id}
            className="soft-card overflow-hidden rounded-2xl"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={memory.image_url}
                alt={memory.note || "Memory"}
                className="h-full w-full object-cover"
              />

              <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-pink-400 shadow-lg backdrop-blur">
                {getYear(memory.memory_date)}
              </div>
            </div>

            <div className="px-4 py-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatMemoryDate(memory.memory_date)}
              </p>

              {memory.note && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {memory.note}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}