"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type MonthlyRecapCardProps = {
  monthLabel: string;
};

export default function MonthlyRecapCard({
  monthLabel,
}: MonthlyRecapCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/monthly-recap")}
      className="group relative w-full overflow-hidden rounded-[28px] text-left transition-all duration-300 hover:-translate-y-1"
      style={{
        background:
          "linear-gradient(135deg, #f7dff0 0%, #eee4f8 48%, #e5eaff 100%)",
        boxShadow:
          "10px 10px 24px rgba(174, 184, 196, 0.45), -10px -10px 24px rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/25 blur-2xl" />

      <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-pink-300/20 blur-3xl" />

      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                strokeWidth={1.8}
                className="text-pink-400"
              />

              <p className="text-[10px] font-bold tracking-[0.2em] text-pink-400">
                YOUR MONTHLY RECAP
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-700 sm:text-3xl">
              {monthLabel}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              A little look at what you and your money have been up to. ♡
            </p>
          </div>

          <div className="soft-card-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/30">
            <Sparkles
              size={19}
              strokeWidth={1.7}
              className="text-indigo-400"
            />
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/35 px-4 py-2.5 text-sm font-semibold text-slate-600 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/55">
          See your recap

          <ArrowRight
            size={16}
            strokeWidth={2}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </button>
  );
}