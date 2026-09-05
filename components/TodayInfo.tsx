"use client";

import { useEffect, useState } from "react";

type Props = {
  weekNumber: number | null;
};

export default function TodayInfo({ weekNumber }: Props) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const currentTime = new Date();

    setNow(currentTime);
    setMounted(true);

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const date = mounted && now
    ? now.toLocaleDateString("en-US", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const time = mounted && now
    ? now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <div className="shrink-0 rounded-2xl px-4 py-3 text-right">
      <p className="text-sm font-semibold text-slate-600">
        {date}
      </p>

      <p className="mt-1 text-xs font-semibold text-indigo-500">
        {weekNumber ? `M${weekNumber}` : "M—"}
        <span className="mx-2 text-slate-300">•</span>
        {time} WIB
      </p>
    </div>
  );
}