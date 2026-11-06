"use client";

import { useState } from "react";
import SavingsCoinTransfer from "@/components/SavingsCoinTransfer";

type Props = {
  income: React.ReactNode;
  outcome: React.ReactNode;
};

export default function HananTabs({ income, outcome }: Props) {
  const [activeTab, setActiveTab] = useState<"income" | "outcome">("income");

  return (
    <div className="hanan-savings-motion" data-active-tab={activeTab}>
      <SavingsCoinTransfer activeTab={activeTab} />
      <div className="income-tabs relative z-10 flex items-end gap-2 px-2" aria-label="Transaction type">
        <button
          type="button"
          aria-pressed={activeTab === "income"}
          aria-controls="hanan-transactions-panel"
          onClick={() => setActiveTab("income")}
          className={`rounded-t-2xl px-7 py-3 text-sm font-semibold transition ${
            activeTab === "income"
              ? "bg-[var(--surface)] text-[var(--primary)] shadow-[0_-4px_10px_rgba(174,184,196,0.18)]"
              : "bg-[var(--surface-raised)] text-[var(--muted)]"
          }`}
        >
          Income
        </button>

        <button
          type="button"
          aria-pressed={activeTab === "outcome"}
          aria-controls="hanan-transactions-panel"
          onClick={() => setActiveTab("outcome")}
          className={`rounded-t-2xl px-7 py-3 text-sm font-semibold transition ${
            activeTab === "outcome"
              ? "bg-[var(--surface)] text-[var(--primary)] shadow-[0_-4px_10px_rgba(174,184,196,0.18)]"
              : "bg-[var(--surface-raised)] text-[var(--muted)]"
          }`}
        >
          Outcome
        </button>
      </div>

      <div key={activeTab} id="hanan-transactions-panel" className="savings-tab-panel" role="region" aria-label={`${activeTab === "income" ? "Income" : "Outcome"} transactions`}>{activeTab === "income" ? income : outcome}</div>
    </div>
  );
}
