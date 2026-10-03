"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import AnimatedCounter from "@/components/recap/AnimatedCounter";

type RecapMemory = {
  id: string;
  imagePath: string;
  note: string;
  memoryDate: string;
};

type MonthlyRecapData = {
  monthLabel: string;
  saved: number;
  spent: number;
  previousSaved: number;
  growthPercentage: number | null;
  largestExpense: {
    amount: number;
    reason: string;
    date: string;
  } | null;
  memories: RecapMemory[];
  savingWeeks: number;
  goalProgress: number;
  balanceAtEndOfMonth: number;
};

type MonthlyRecapProps = {
  recap: MonthlyRecapData;
};

export default function MonthlyRecap({ recap }: MonthlyRecapProps) {
  const router = useRouter();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEntering, setIsEntering] = useState(true);
  const [counterComplete, setCounterComplete] = useState(false);
  const [spentCounterComplete, setSpentCounterComplete] = useState(false);
  const [graphProgress, setGraphProgress] = useState(0);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const [memoryIndex, setMemoryIndex] = useState(0);
  const [memorySpinning, setMemorySpinning] = useState(false);
  const [memoryRevealed, setMemoryRevealed] = useState(false);

  const handleCounterComplete = useCallback(() => {
    setCounterComplete(true);
  }, []);
  const handleSpentCounterComplete = useCallback(() => {
    setSpentCounterComplete(true);
  }, []);

  const handleShare = useCallback(async () => {
    const shareText = [
      `✨ My ${recap.monthLabel} Recap`,
      ``,
      `HANAN saved: Rp${recap.saved.toLocaleString("id-ID")}`,
      `Spent: Rp${recap.spent.toLocaleString("id-ID")}`,
      `Saving weeks: ${recap.savingWeeks}`,
      `Goal progress: ${recap.goalProgress.toFixed(1)}%`,
      ``,
      `You saved. You grew. You made memories. ♡`,
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${recap.monthLabel} — HANAN Recap`,
          text: shareText,
        });
      } catch {
        // User closed the share dialog.
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert("Recap copied to clipboard ♡");
    } catch {
      alert("Unable to share the recap.");
    }
  }, [recap]);

  const slides = [
    "opening",
    "saved",
    "spent",
    "growing",
    ...(recap.memories.length > 0 ? ["memory"] : []),
    "summary",
  ] as const;

  const totalSlides = slides.length;
  const currentSlideKey = slides[currentSlide];

  const changeSlide = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= totalSlides) {
        return;
      }

      setIsEntering(false);
      setCounterComplete(false);
      setSpentCounterComplete(false);
      setGraphProgress(0);

      setTimeout(() => {
        setCurrentSlide(nextIndex);
        setIsEntering(true);
      }, 100);
    },
    [totalSlides],
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((current) => {
      if (current >= totalSlides - 1) {
        return current;
      }

      return current + 1;
    });

    setIsEntering(false);
    setCounterComplete(false);
    setSpentCounterComplete(false);
    setGraphProgress(0);

    setTimeout(() => {
      setIsEntering(true);
    }, 100);
  }, [totalSlides]);

  const previousSlide = useCallback(() => {
    setCurrentSlide((current) => {
      if (current <= 0) {
        return current;
      }

      return current - 1;
    });

    setIsEntering(false);
    setCounterComplete(false);
    setSpentCounterComplete(false);
    setGraphProgress(0);

    setTimeout(() => {
      setIsEntering(true);
    }, 100);
  }, []);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      setTouchStartX(event.touches[0].clientX);
      setTouchEndX(null);
    },
    [],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      setTouchEndX(event.touches[0].clientX);
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchStartX === null || touchEndX === null) {
      return;
    }

    const distance = touchStartX - touchEndX;
    const minimumSwipeDistance = 50;

    if (Math.abs(distance) < minimumSwipeDistance) {
      return;
    }

    if (distance > 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  }, [touchStartX, touchEndX, nextSlide, previousSlide]);

  useEffect(() => {
    if (currentSlideKey !== "memory" || !isEntering) {
      return;
    }

    if (recap.memories.length === 0) {
      return;
    }

    setMemoryRevealed(false);

    if (recap.memories.length === 1) {
      setMemoryIndex(0);

      const timeout = setTimeout(() => {
        setMemoryRevealed(true);
      }, 700);

      return () => clearTimeout(timeout);
    }

    setMemorySpinning(true);

    let spinCount = 0;
    let currentIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function spin() {
      currentIndex = (currentIndex + 1) % recap.memories.length;

      setMemoryIndex(currentIndex);

      spinCount++;

      if (spinCount < 18) {
        const progress = spinCount / 18;

        const delay = 70 + Math.pow(progress, 2) * 240;

        timeout = setTimeout(spin, delay);
      } else {
        const finalIndex = Math.floor(Math.random() * recap.memories.length);

        setMemoryIndex(finalIndex);
        setMemorySpinning(false);

        timeout = setTimeout(() => {
          setMemoryRevealed(true);
        }, 500);
      }
    }

    timeout = setTimeout(spin, 80);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentSlideKey, isEntering, recap.memories.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextSlide();
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        previousSlide();
      }

      if (event.key === "Escape") {
        router.push("/");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextSlide, previousSlide, router]);

  useEffect(() => {
    if (currentSlideKey !== "growing" || !isEntering) {
      setGraphProgress(0);
      return;
    }

    let animationFrame: number;
    const startTime = performance.now();

    const duration = 1800;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;

      const progress = Math.min(elapsed / duration, 1);

      // Ease-out:
      // cepat di awal → melambat ketika mendekati tujuan
      const easedProgress =
        progress < 0.6
          ? 0.82 * Math.pow(progress / 0.6, 0.55)
          : 0.82 + 0.18 * (1 - Math.pow(1 - (progress - 0.6) / 0.4, 3));

      setGraphProgress(easedProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [currentSlideKey, isEntering]);

  const maxGraphValue = Math.max(recap.previousSaved, recap.saved, 1);

  const previousGraphY = 175 - (recap.previousSaved / maxGraphValue) * 125;

  const currentGraphY = 175 - (recap.saved / maxGraphValue) * 125;

  const animatedCurrentGraphX = 90 + (510 - 90) * graphProgress;

  const animatedCurrentGraphY =
    previousGraphY + (currentGraphY - previousGraphY) * graphProgress;

  return (
    <main
      className="fixed inset-0 z-50 overflow-hidden bg-[#e8edf3]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress */}
      <div className="absolute left-1/2 top-5 z-50 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? "w-8 bg-slate-600" : "w-2 bg-slate-300"
            }`}
          />
        ))}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="absolute right-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/40 text-slate-500 backdrop-blur-sm transition hover:bg-white/70"
        aria-label="Close recap"
      >
        <X size={19} />
      </button>

      {/* Slides */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            touchAction: "pan-y",
          }}
        ></div>
        {/* Slide 1 */}
        <section className="relative flex h-full min-w-full items-center justify-center overflow-hidden px-6">
          {/* =========================================
      BACKGROUND
  ========================================= */}

          {/* Main pink blob */}
          <div
            className="recap-blob absolute -left-24 top-16 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl"
            style={{
              animationDelay: "0ms",
            }}
          />

          {/* Main lavender blob */}
          <div
            className="recap-blob absolute -bottom-24 right-[-40px] h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl"
            style={{
              animationDelay: "180ms",
            }}
          />

          {/* Center glow */}
          <div className="recap-glow absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

          {/* =========================================
      FLOATING SPARKLES
  ========================================= */}

          <div
            className="recap-sparkle absolute left-[18%] top-[24%] text-xl text-pink-300"
            style={{
              animationDelay: "500ms",
            }}
          >
            ✦
          </div>

          <div
            className="recap-sparkle absolute right-[20%] top-[22%] text-2xl text-indigo-300"
            style={{
              animationDelay: "1.2s",
            }}
          >
            ✧
          </div>

          <div
            className="recap-sparkle absolute bottom-[27%] left-[25%] text-lg text-pink-300"
            style={{
              animationDelay: "1.8s",
            }}
          >
            ✦
          </div>

          <div
            className="recap-sparkle absolute bottom-[30%] right-[25%] text-xl text-indigo-300"
            style={{
              animationDelay: "2.3s",
            }}
          >
            ✧
          </div>

          {/* =========================================
      FLOATING HEARTS
  ========================================= */}

          <div
            className="recap-heart absolute left-[28%] top-[34%] text-sm text-pink-300"
            style={{
              animationDelay: "1s",
            }}
          >
            ♡
          </div>

          <div
            className="recap-heart absolute right-[29%] top-[39%] text-base text-pink-300"
            style={{
              animationDelay: "2s",
            }}
          >
            ♡
          </div>

          <div
            className="recap-heart absolute bottom-[27%] right-[36%] text-xs text-indigo-300"
            style={{
              animationDelay: "2.8s",
            }}
          >
            ♡
          </div>

          {/* =========================================
      DECORATIVE FLOATING DOTS
  ========================================= */}

          <div
            className="recap-float absolute left-[14%] top-[45%] h-2 w-2 rounded-full bg-pink-300/70"
            style={{
              animationDelay: "0.5s",
            }}
          />

          <div
            className="recap-float-slow absolute right-[15%] top-[48%] h-2.5 w-2.5 rounded-full bg-indigo-300/70"
            style={{
              animationDelay: "1.5s",
            }}
          />

          <div
            className="recap-float absolute bottom-[22%] left-[40%] h-1.5 w-1.5 rounded-full bg-pink-300/60"
            style={{
              animationDelay: "2s",
            }}
          />

          {/* =========================================
      MAIN CONTENT
  ========================================= */}

          <div
            key={`slide-1-${currentSlide}-${isEntering}`}
            className="relative z-10 max-w-xl text-center"
          >
            {/* Small label */}
            <p
              className="recap-fade-up text-xs font-bold tracking-[0.3em] text-pink-400 sm:text-sm"
              style={{
                animationDelay: "250ms",
              }}
            >
              YOUR MONTHLY RECAP
            </p>

            {/* Month */}
            <h1
              className="recap-fade-scale mt-5 text-5xl font-bold tracking-tight text-slate-700 sm:text-7xl"
              style={{
                animationDelay: "500ms",
              }}
            >
              {recap.monthLabel}
            </h1>

            {/* Tiny divider */}
            <div
              className="recap-fade-up mx-auto mt-5 flex items-center justify-center gap-2"
              style={{
                animationDelay: "700ms",
              }}
            >
              <span className="h-px w-8 bg-pink-200" />
              <span className="text-xs text-pink-300">♡</span>
              <span className="h-px w-8 bg-pink-200" />
            </div>

            {/* Subtitle */}
            <p
              className="recap-fade-up mx-auto mt-6 max-w-md text-base leading-7 text-slate-500 sm:text-lg sm:leading-8"
              style={{
                animationDelay: "850ms",
              }}
            >
              Let&apos;s see what you and your money
              <br className="hidden sm:block" />
              have been up to... 💕
            </p>

            {/* Button */}
            <div
              className="recap-fade-up"
              style={{
                animationDelay: "1150ms",
              }}
            >
              <button
                type="button"
                onClick={nextSlide}
                className="soft-button mt-10 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                Let&apos;s go
                <ArrowRight size={17} strokeWidth={2} />
              </button>
            </div>

            {/* Hint */}
            <p
              className="recap-fade-up mt-5 text-[11px] text-slate-400"
              style={{
                animationDelay: "1450ms",
              }}
            >
              swipe or tap to explore your month
            </p>
          </div>
        </section>

        {/* Slide 2 — YOU SAVED */}
        <section className="relative flex h-full min-w-full items-center justify-center overflow-hidden px-6">
          {/* =========================================
      BACKGROUND
  ========================================= */}

          {/* Pink glow */}
          <div className="absolute left-[-80px] top-[18%] h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

          {/* Lavender glow */}
          <div className="absolute bottom-[-100px] right-[-60px] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

          {/* Center glow */}
          <div className="recap-glow absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

          {/* =========================================
      FLOATING SPARKLES
  ========================================= */}

          <div
            className="recap-sparkle absolute left-[18%] top-[28%] text-xl text-pink-300"
            style={{
              animationDelay: "0s",
            }}
          >
            ✦
          </div>

          <div
            className="recap-sparkle absolute right-[18%] top-[32%] text-2xl text-indigo-300"
            style={{
              animationDelay: "0.8s",
            }}
          >
            ✧
          </div>

          <div
            className="recap-sparkle absolute bottom-[27%] left-[24%] text-lg text-pink-300"
            style={{
              animationDelay: "1.5s",
            }}
          >
            ✦
          </div>

          <div
            className="recap-sparkle absolute bottom-[25%] right-[25%] text-xl text-indigo-300"
            style={{
              animationDelay: "2s",
            }}
          >
            ✧
          </div>

          {/* =========================================
      FLOATING HEARTS
  ========================================= */}

          <div
            className="recap-heart absolute left-[30%] top-[38%] text-sm text-pink-300"
            style={{
              animationDelay: "0.7s",
            }}
          >
            ♡
          </div>

          <div
            className="recap-heart absolute right-[29%] top-[43%] text-base text-pink-300"
            style={{
              animationDelay: "1.7s",
            }}
          >
            ♡
          </div>

          {/* =========================================
      MAIN CONTENT
  ========================================= */}

          <div
            key={`slide-2-${currentSlide}-${isEntering}`}
            className="relative z-10 text-center"
          >
            {/* Label */}
            <p
              className="recap-fade-up text-xs font-bold tracking-[0.3em] text-indigo-400 sm:text-sm"
              style={{
                animationDelay: "150ms",
              }}
            >
              YOU SAVED
            </p>

            {/* Small decorative line */}
            <div
              className="recap-fade-up mx-auto mt-5 flex items-center justify-center gap-2"
              style={{
                animationDelay: "350ms",
              }}
            >
              <span className="h-px w-8 bg-indigo-200" />
              <span className="text-xs text-indigo-300">♡</span>
              <span className="h-px w-8 bg-indigo-200" />
            </div>

            {/* Amount */}
            <div
              className="recap-fade-scale mt-8"
              style={{
                animationDelay: "450ms",
              }}
            >
              <div className="relative inline-block">
                {/* =====================================
      FINAL SPARKLE BURST
  ===================================== */}

                {counterComplete && (
                  <>
                    {/* Center glow */}
                    <div className="recap-burst absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-2xl" />

                    {/* Top left */}
                    <span
                      className="recap-burst-star absolute left-0 top-1/2 text-xl text-pink-300"
                      style={
                        {
                          "--burst-x": "-55px",
                          "--burst-y": "-45px",
                        } as CSSProperties
                      }
                    >
                      ✦
                    </span>

                    {/* Top right */}
                    <span
                      className="recap-burst-star absolute right-0 top-1/2 text-2xl text-indigo-300"
                      style={
                        {
                          "--burst-x": "55px",
                          "--burst-y": "-50px",
                        } as CSSProperties
                      }
                    >
                      ✧
                    </span>

                    {/* Bottom left */}
                    <span
                      className="recap-burst-star absolute bottom-0 left-1/4 text-lg text-pink-300"
                      style={
                        {
                          "--burst-x": "-45px",
                          "--burst-y": "45px",
                        } as CSSProperties
                      }
                    >
                      ✦
                    </span>

                    {/* Bottom right */}
                    <span
                      className="recap-burst-star absolute bottom-0 right-1/4 text-xl text-indigo-300"
                      style={
                        {
                          "--burst-x": "45px",
                          "--burst-y": "45px",
                        } as CSSProperties
                      }
                    >
                      ✧
                    </span>

                    {/* Tiny star */}
                    <span
                      className="recap-burst-star absolute left-1/2 top-0 text-xs text-pink-300"
                      style={
                        {
                          "--burst-x": "0px",
                          "--burst-y": "-65px",
                        } as CSSProperties
                      }
                    >
                      ✦
                    </span>
                  </>
                )}

                {/* Normal glow */}
                <div className="recap-glow absolute inset-0 scale-110 rounded-full bg-white/50 blur-3xl" />

                {/* Number */}
                <h2 className="relative text-6xl font-bold tracking-tight text-slate-700 sm:text-8xl">
                  <AnimatedCounter
                    value={recap.saved}
                    duration={3000}
                    start={isEntering}
                    onComplete={handleCounterComplete}
                  />
                </h2>
              </div>
            </div>

            {/* Caption */}
            <p
              className={`mt-7 text-base text-slate-500 transition-all duration-700 sm:text-lg ${
                counterComplete
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
            >
              saved into HANAN this month ♡
            </p>

            {/* Small message */}
            <p
              className={`mt-3 text-xs text-slate-400 transition-all duration-700 ${
                counterComplete
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              }`}
            >
              every little bit counts
            </p>
          </div>
        </section>

        {/* Slide 3 */}
        <section
          className="relative flex h-full min-w-full items-center justify-center overflow-hidden px-6"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(251, 207, 232, 0.5), transparent 38%), linear-gradient(135deg, #fff8fb 0%, #f7f1ff 50%, #eef4ff 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-rose-200/30 blur-3xl" />

          <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="pointer-events-none absolute left-[18%] top-[20%] h-2 w-2 rounded-full bg-rose-300 recap-float" />

          <div className="pointer-events-none absolute right-[22%] top-[28%] h-3 w-3 rounded-full bg-violet-300 recap-float-slow" />

          <div className="pointer-events-none absolute bottom-[22%] left-[25%] text-rose-300 recap-heart">
            ♡
          </div>

          <div className="pointer-events-none absolute right-[25%] bottom-[25%] text-violet-300 recap-sparkle">
            ✦
          </div>

          <div
            key={`slide-3-${currentSlide}-${isEntering}`}
            className="relative z-10 w-full max-w-2xl text-center"
          >
            {/* Label */}
            <p className="recap-fade-up text-sm font-bold tracking-[0.28em] text-rose-400">
              YOU SPENT
            </p>

            {/* Decorative line */}
            <div className="mx-auto mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-rose-200" />
              <span className="text-xs text-rose-300">♡</span>
              <span className="h-px w-10 bg-rose-200" />
            </div>

            {/* Main amount */}
            <div className="mt-7 recap-fade-scale">
              <h2 className="text-6xl font-bold tracking-tight text-slate-700 sm:text-8xl">
                <AnimatedCounter
                  value={recap.spent}
                  duration={2600}
                  start={isEntering}
                  onComplete={handleSpentCounterComplete}
                />
              </h2>

              <p className="mt-3 text-sm text-slate-400 sm:text-base">
                spent from HANAN this month
              </p>
            </div>

            {/* Expense detail */}
            {spentCounterComplete && recap.largestExpense ? (
              <div
                className={`mx-auto mt-10 max-w-md transition-all duration-700 ${
                  isEntering
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: "900ms",
                }}
              >
                <div className="rounded-[28px] border border-white/80 bg-white/65 px-6 py-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    biggest expense
                  </p>

                  <p className="mt-3 text-2xl font-bold text-slate-700">
                    Rp
                    {recap.largestExpense.amount.toLocaleString("id-ID")}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {recap.largestExpense.reason}
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span>♡</span>
                    <span>your money went somewhere meaningful</span>
                    <span>♡</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div
                className={`mt-10 transition-all duration-700 ${
                  isEntering
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: "700ms",
                }}
              >
                <div className="mx-auto max-w-md rounded-[28px] border border-white/80 bg-white/60 px-6 py-6 shadow-[0_18px_50px_rgba(148,163,184,0.12)] backdrop-blur-md">
                  <div className="text-3xl">🌷</div>

                  <p className="mt-3 text-base font-medium text-slate-600">
                    No spending from HANAN this month. ♡
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    you kept it cozy
                  </p>
                </div>
              </div>
            )}

            {/* Bottom message */}
            <p
              className={`mt-8 text-xs text-slate-400 transition-all duration-700 ${
                isEntering ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transitionDelay: "1200ms",
              }}
            >
              every little choice adds up ✨
            </p>
          </div>
        </section>

        {/* Slide 4 */}
        <section
          className="relative flex h-full min-w-full items-center justify-center overflow-hidden px-6"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(221, 214, 254, 0.45), transparent 38%), linear-gradient(135deg, #faf8ff 0%, #f5f1ff 48%, #f0f7ff 100%)",
          }}
        >
          {/* Decorative background */}
          <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-200/25 blur-3xl" />

          <div className="pointer-events-none absolute left-[18%] top-[22%] text-violet-300 recap-sparkle">
            ✦
          </div>

          <div className="pointer-events-none absolute right-[20%] top-[25%] text-indigo-300 recap-heart">
            ♡
          </div>

          <div className="pointer-events-none absolute bottom-[22%] left-[23%] h-2 w-2 rounded-full bg-violet-300 recap-float" />

          <div className="pointer-events-none absolute right-[25%] bottom-[24%] h-3 w-3 rounded-full bg-blue-200 recap-float-slow" />

          <div
            key={`slide-4-${currentSlide}-${isEntering}`}
            className="relative z-10 w-full max-w-3xl text-center"
          >
            {/* Label */}
            <p className="recap-fade-up text-sm font-bold tracking-[0.28em] text-violet-400">
              YOU'RE GROWING
            </p>

            <div className="mx-auto mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-violet-200" />
              <span className="text-xs text-violet-300">✦</span>
              <span className="h-px w-10 bg-violet-200" />
            </div>

            {/* Main message */}
            <div className="mt-7 recap-fade-scale">
              <h2 className="text-4xl font-bold tracking-tight text-slate-700 sm:text-6xl">
                Look at you go.
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                Your HANAN savings compared to the month before.
              </p>
            </div>

            {/* Graph */}
            <div
              className={`mx-auto mt-10 max-w-2xl transition-all duration-1000 ${
                isEntering
                  ? "translate-y-0 opacity-100"
                  : "translate-y-5 opacity-0"
              }`}
              style={{
                transitionDelay: "500ms",
              }}
            >
              <div className="rounded-[32px] border border-white/80 bg-white/60 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.14)] backdrop-blur-md sm:p-7">
                <div className="relative h-48 sm:h-56">
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-0 border-t border-slate-200/50" />
                  <div className="absolute inset-x-0 top-1/2 border-t border-slate-200/40" />
                  <div className="absolute inset-x-0 bottom-0 border-t border-slate-200/50" />

                  {/* SVG line */}
                  <svg
                    viewBox="0 0 600 220"
                    className="absolute inset-0 h-full w-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {/* Grid */}
                    <line
                      x1="0"
                      y1="20"
                      x2="600"
                      y2="20"
                      className="stroke-slate-200/40"
                      strokeWidth="1"
                    />

                    <line
                      x1="0"
                      y1="110"
                      x2="600"
                      y2="110"
                      className="stroke-slate-200/40"
                      strokeWidth="1"
                    />

                    <line
                      x1="0"
                      y1="200"
                      x2="600"
                      y2="200"
                      className="stroke-slate-200/40"
                      strokeWidth="1"
                    />

                    {/* Graph line */}
                    <line
                      x1="90"
                      y1={previousGraphY}
                      x2={animatedCurrentGraphX}
                      y2={animatedCurrentGraphY}
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="stroke-violet-300"
                    />

                    {/* Previous point */}
                    <circle
                      cx="90"
                      cy={previousGraphY}
                      r="9"
                      className="fill-white stroke-violet-300"
                      strokeWidth="4"
                    />

                    {/* Current point glow */}
                    <circle
                      cx={animatedCurrentGraphX}
                      cy={animatedCurrentGraphY}
                      r="24"
                      className="fill-rose-200/20"
                    />

                    {/* Current point */}
                    <circle
                      cx={animatedCurrentGraphX}
                      cy={animatedCurrentGraphY}
                      r="11"
                      className="fill-white stroke-rose-300"
                      strokeWidth="4"
                    />
                  </svg>

                  {/* Previous label */}
                  <div
                    className={`absolute bottom-[-2px] left-[5%] text-left transition-all duration-700 ${
                      isEntering
                        ? "translate-y-0 opacity-100"
                        : "translate-y-3 opacity-0"
                    }`}
                    style={{
                      transitionDelay: "800ms",
                    }}
                  >
                    <p className="text-xs font-medium text-slate-400">
                      Previous month
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-600 sm:text-base">
                      Rp{recap.previousSaved.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {/* Current label */}
                  <div
                    className={`absolute right-[2%] top-[-8px] text-right transition-all duration-700 ${
                      isEntering
                        ? "translate-y-0 opacity-100"
                        : "translate-y-3 opacity-0"
                    }`}
                    style={{
                      transitionDelay: "1500ms",
                    }}
                  >
                    <p className="text-xs font-medium text-slate-400">
                      {recap.monthLabel}
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-600 sm:text-base">
                      Rp{recap.saved.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* Growth percentage */}
                <div
                  className={`mt-5 border-t border-slate-200/50 pt-5 transition-all duration-700 ${
                    isEntering
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0"
                  }`}
                  style={{
                    transitionDelay: "1800ms",
                  }}
                >
                  {recap.growthPercentage !== null ? (
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-violet-500 sm:text-4xl">
                        {recap.growthPercentage >= 0 ? "+" : ""}
                        {recap.growthPercentage.toFixed(1)}%
                      </p>

                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        growth from last month
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base font-semibold text-slate-600">
                        A fresh start. 🌱
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        No previous month to compare yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom message */}
            <p
              className={`mt-7 text-xs text-slate-400 transition-all duration-700 ${
                isEntering ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transitionDelay: "2100ms",
              }}
            >
              small steps become something bigger ✨
            </p>
          </div>
        </section>

        {/* Slide 5 */}
        {recap.memories.length > 0 && (
          <section
            className="relative flex h-full min-w-full items-center justify-center overflow-hidden px-6"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(251, 207, 232, 0.45), transparent 38%), linear-gradient(135deg, #fff9fc 0%, #f8f1ff 50%, #f0f7ff 100%)",
            }}
          >
            {/* Background blobs */}
            <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />

            <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />

            {/* Floating decorations */}
            <div className="pointer-events-none absolute left-[18%] top-[20%] text-xl text-pink-300 recap-sparkle">
              ✦
            </div>

            <div className="pointer-events-none absolute right-[20%] top-[24%] text-2xl text-violet-300 recap-sparkle">
              ✧
            </div>

            <div className="pointer-events-none absolute bottom-[24%] left-[22%] text-sm text-pink-300 recap-heart">
              ♡
            </div>

            <div className="pointer-events-none absolute bottom-[25%] right-[23%] text-lg text-violet-300 recap-heart">
              ♡
            </div>

            <div
              key={`slide-5-${currentSlide}-${isEntering}`}
              className="relative z-10 w-full max-w-xl text-center"
            >
              {/* Label */}
              <p className="recap-fade-up text-sm font-bold tracking-[0.28em] text-pink-400">
                HANAN MEMORY
              </p>

              {/* Decorative line */}
              <div
                className="recap-fade-up mx-auto mt-4 flex items-center justify-center gap-3"
                style={{
                  animationDelay: "200ms",
                }}
              >
                <span className="h-px w-10 bg-pink-200" />
                <span className="text-xs text-pink-300">♡</span>
                <span className="h-px w-10 bg-pink-200" />
              </div>

              {/* Memory roulette area */}
              <div className="relative mx-auto mt-8 h-[390px] w-full max-w-[350px]">
                {/* Soft glow */}
                <div
                  className={`absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-200/30 blur-3xl transition-all duration-700 ${
                    memoryRevealed
                      ? "scale-110 opacity-100"
                      : "scale-90 opacity-50"
                  }`}
                />

                {/* Polaroid */}
                <div
                  className={`absolute left-1/2 top-1/2 w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] bg-white p-3 pb-5 shadow-[0_25px_70px_rgba(148,163,184,0.22)] transition-all ${
                    memorySpinning
                      ? "scale-[0.96] rotate-[-4deg] duration-100"
                      : memoryRevealed
                        ? "scale-100 rotate-[-2deg] duration-700"
                        : "scale-90 rotate-[4deg] opacity-0 duration-500"
                  }`}
                >
                  <div className="aspect-square overflow-hidden rounded-[5px] bg-slate-100">
                    <MemoryImage
                      key={recap.memories[memoryIndex].id}
                      imagePath={recap.memories[memoryIndex].imagePath}
                    />
                  </div>

                  {/* Memory info */}
                  <div
                    className={`transition-all duration-700 ${
                      memoryRevealed
                        ? "translate-y-0 opacity-100"
                        : "translate-y-3 opacity-0"
                    }`}
                  >
                    <p className="mt-4 line-clamp-2 text-sm font-medium text-slate-600">
                      {recap.memories[memoryIndex].note || "A little memory ♡"}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {recap.memories[memoryIndex].memoryDate}
                    </p>
                  </div>
                </div>

                {/* Roulette indicator */}
                {memorySpinning && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/70 px-4 py-2 text-xs font-medium text-slate-400 shadow-sm backdrop-blur-md">
                    finding a little memory...
                  </div>
                )}
              </div>

              {/* Reveal caption */}
              <p
                className={`mt-2 text-sm text-slate-400 transition-all duration-700 ${
                  memoryRevealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
              >
                one little moment worth remembering ♡
              </p>
            </div>
          </section>
        )}

        {/* Slide 6 */}
        <section
          className="relative flex h-full min-w-full items-center justify-center overflow-hidden px-6"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(221, 214, 254, 0.45), transparent 38%), linear-gradient(135deg, #faf8ff 0%, #f7f1ff 50%, #fff8fb 100%)",
          }}
        >
          {/* Background blobs */}
          <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-pink-200/30 blur-3xl" />

          <div className="recap-glow pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

          {/* Floating decorations */}
          <div className="pointer-events-none absolute left-[15%] top-[20%] text-xl text-violet-300 recap-sparkle">
            ✦
          </div>

          <div className="pointer-events-none absolute right-[17%] top-[23%] text-2xl text-pink-300 recap-sparkle">
            ✧
          </div>

          <div className="pointer-events-none absolute bottom-[24%] left-[20%] text-sm text-pink-300 recap-heart">
            ♡
          </div>

          <div className="pointer-events-none absolute bottom-[22%] right-[22%] text-lg text-violet-300 recap-heart">
            ♡
          </div>

          {/* Main content */}
          <div
            key={`slide-6-${currentSlide}-${isEntering}`}
            className="relative z-10 w-full max-w-xl text-center"
          >
            {/* Label */}
            <p
              className="recap-fade-up text-xs font-bold tracking-[0.3em] text-violet-400 sm:text-sm"
              style={{
                animationDelay: "150ms",
              }}
            >
              {recap.monthLabel.toUpperCase()} IN NUMBERS
            </p>

            {/* Decorative line */}
            <div
              className="recap-fade-up mx-auto mt-4 flex items-center justify-center gap-2"
              style={{
                animationDelay: "300ms",
              }}
            >
              <span className="h-px w-8 bg-violet-200" />
              <span className="text-xs text-violet-300">✦</span>
              <span className="h-px w-8 bg-violet-200" />
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <div
                className="recap-fade-up rounded-[26px] border border-white/80 bg-white/55 p-5 shadow-[0_18px_45px_rgba(148,163,184,0.10)] backdrop-blur-md"
                style={{
                  animationDelay: "450ms",
                }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  HANAN saved
                </p>

                <p className="mt-2 text-lg font-bold text-slate-700 sm:text-xl">
                  Rp{recap.saved.toLocaleString("id-ID")}
                </p>
              </div>

              <div
                className="recap-fade-up rounded-[26px] border border-white/80 bg-white/55 p-5 shadow-[0_18px_45px_rgba(148,163,184,0.10)] backdrop-blur-md"
                style={{
                  animationDelay: "550ms",
                }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Spent
                </p>

                <p className="mt-2 text-lg font-bold text-slate-700 sm:text-xl">
                  Rp{recap.spent.toLocaleString("id-ID")}
                </p>
              </div>

              <div
                className="recap-fade-up rounded-[26px] border border-white/80 bg-white/55 p-5 shadow-[0_18px_45px_rgba(148,163,184,0.10)] backdrop-blur-md"
                style={{
                  animationDelay: "650ms",
                }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Saving weeks
                </p>

                <p className="mt-2 text-lg font-bold text-slate-700 sm:text-xl">
                  {recap.savingWeeks} weeks
                </p>
              </div>

              <div
                className="recap-fade-up rounded-[26px] border border-white/80 bg-white/55 p-5 shadow-[0_18px_45px_rgba(148,163,184,0.10)] backdrop-blur-md"
                style={{
                  animationDelay: "750ms",
                }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Goal progress
                </p>

                <p className="mt-2 text-lg font-bold text-slate-700 sm:text-xl">
                  {recap.goalProgress.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Closing message */}
            <div
              className="recap-fade-scale mt-9"
              style={{
                animationDelay: "950ms",
              }}
            >
              <p className="text-3xl font-bold tracking-tight text-slate-700 sm:text-4xl">
                That&apos;s your {recap.monthLabel}. 🌷
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
                You saved. You grew.
                <br />
                You made memories.
              </p>

              <p className="mt-3 text-sm text-slate-400">
                See you next month, HANAN ♡
              </p>
            </div>

            {/* Back button */}
            <div
              className="recap-fade-up mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{
                animationDelay: "1200ms",
              }}
            >
              <button
                type="button"
                onClick={handleShare}
                className="soft-button inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                ♡ Share Recap
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-slate-400 transition-all duration-300 hover:bg-white/40 hover:text-slate-600"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation */}
      {currentSlide > 0 && (
        <button
          type="button"
          onClick={previousSlide}
          className="absolute bottom-7 left-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/40 text-slate-500 backdrop-blur-sm transition hover:bg-white/70"
          aria-label="Previous slide"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      {currentSlide < totalSlides - 1 && (
        <button
          type="button"
          onClick={nextSlide}
          className="absolute bottom-7 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/40 text-slate-500 backdrop-blur-sm transition hover:bg-white/70"
          aria-label="Next slide"
        >
          <ArrowRight size={18} />
        </button>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/40 p-5 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 text-lg font-bold text-slate-700">{value}</p>
    </div>
  );
}

function MemoryImage({ imagePath }: { imagePath: string }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const imageUrl = `${supabaseUrl}/storage/v1/object/public/memory-images/${imagePath}`;

  return (
    <img
      src={imageUrl}
      alt="HANAN Memory"
      className="h-full w-full object-cover"
    />
  );
}
