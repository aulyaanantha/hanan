"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";

export default function UpdateSeaBankBalance({
  currentBalance,
}: {
  currentBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(
    currentBalance.toString(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const numericBalance = Number(balance);

    if (!Number.isFinite(numericBalance) || numericBalance < 0) {
      setError("Please enter a valid balance.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/seabank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          balance: numericBalance,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update balance.");
      }

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setBalance(currentBalance.toString());
          setError("");
          setOpen(true);
        }}
        className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Pencil size={15} />
        Update Balance
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#e8edf3] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-indigo-400">
                  SEABANK
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-700">
                  Update Balance
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Record your current SeaBank balance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="soft-card-inset flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7"
            >
              <label className="text-xs font-bold tracking-wider text-slate-400">
                RECORDED BALANCE
              </label>

              <div className="mt-2 flex items-center rounded-2xl bg-[#e8edf3] px-4 py-3 shadow-[inset_4px_4px_8px_rgba(174,184,196,0.35),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]">
                <span className="mr-2 text-sm font-semibold text-slate-400">
                  Rp
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={balance}
                  onChange={(event) =>
                    setBalance(event.target.value)
                  }
                  className="w-full bg-transparent text-lg font-bold text-slate-700 outline-none"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {error && (
                <p className="mt-3 text-sm font-medium text-rose-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={17} />

                {loading ? "Saving..." : "Save Balance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}