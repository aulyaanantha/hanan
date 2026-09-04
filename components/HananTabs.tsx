"use client";

import { useState } from "react";

type Props = {
  income: React.ReactNode;
  outcome: React.ReactNode;
};

export default function HananTabs({ income, outcome }: Props) {
  const [activeTab, setActiveTab] = useState<"income" | "outcome">("income");

  return (
    <div>
      <div className="relative z-10 flex items-end gap-2 px-2">
        <button
          type="button"
          onClick={() => setActiveTab("income")}
          className={`rounded-t-2xl px-7 py-3 text-sm font-semibold transition ${
            activeTab === "income"
              ? "bg-[#e8edf3] text-indigo-500 shadow-[0_-4px_10px_rgba(174,184,196,0.18)]"
              : "bg-[#dfe4eb] text-slate-500"
          }`}
        >
          Income
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outcome")}
          className={`rounded-t-2xl px-7 py-3 text-sm font-semibold transition ${
            activeTab === "outcome"
              ? "bg-[#e8edf3] text-indigo-500 shadow-[0_-4px_10px_rgba(174,184,196,0.18)]"
              : "bg-[#dfe4eb] text-slate-500"
          }`}
        >
          Outcome
        </button>
      </div>

      <div>{activeTab === "income" ? income : outcome}</div>
    </div>
  );
}
