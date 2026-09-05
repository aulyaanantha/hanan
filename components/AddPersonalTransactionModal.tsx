"use client";

import { useState } from "react";
import { X } from "lucide-react";

type TransactionType = "deposit" | "withdrawal";

type EditingTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  note: string | null;
};

type Props = {
  onClose: () => void;
  editingTransaction?: EditingTransaction | null;
};

export default function AddPersonalTransactionModal({
  onClose,
  editingTransaction = null,
}: Props) {
  const isEditing = Boolean(editingTransaction);

  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type ?? "deposit"
  );

  const [amount, setAmount] = useState(
    editingTransaction
      ? String(editingTransaction.amount)
      : ""
  );

  const [date, setDate] = useState(
    editingTransaction?.transaction_date ??
      new Date().toISOString().split("T")[0]
  );

  const [note, setNote] = useState(
    editingTransaction?.note ?? ""
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function handleAmountChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value.replace(/\D/g, "");
    setAmount(value);
  }

  function formatAmount(value: string) {
    if (!value) {
      return "";
    }

    return new Intl.NumberFormat("id-ID").format(
      Number(value)
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        "/api/personal-savings",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditing
              ? {
                  transactionId:
                    editingTransaction?.id,
                  type,
                  amount: numericAmount,
                  transactionDate: date,
                  note: note.trim(),
                }
              : {
                  type,
                  amount: numericAmount,
                  transactionDate: date,
                  note: note.trim(),
                }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${
              isEditing ? "update" : "save"
            } transaction.`
        );
      }

      window.location.href = "/personal";
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${
              isEditing ? "update" : "save"
            } transaction.`
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#e8edf3] p-5 shadow-[8px_8px_24px_rgba(174,184,196,0.35),-8px_-8px_24px_rgba(255,255,255,0.9)] sm:p-6">
        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-700">
              {isEditing
                ? "Edit Transaction"
                : "Add Transaction"}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {isEditing
                ? "Update your personal savings transaction."
                : "Record a personal savings transaction."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* TYPE */}

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("deposit")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  type === "deposit"
                    ? "bg-white text-emerald-500 shadow-[inset_2px_2px_5px_rgba(174,184,196,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]"
                    : "soft-button text-slate-500"
                }`}
              >
                Deposit
              </button>

              <button
                type="button"
                onClick={() =>
                  setType("withdrawal")
                }
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  type === "withdrawal"
                    ? "bg-white text-rose-400 shadow-[inset_2px_2px_5px_rgba(174,184,196,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]"
                    : "soft-button text-slate-500"
                }`}
              >
                Withdrawal
              </button>
            </div>
          </div>

          {/* AMOUNT */}

          <div>
            <label
              htmlFor="personal-amount"
              className="mb-2 block text-xs font-semibold text-slate-500"
            >
              Amount
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>

              <input
                id="personal-amount"
                type="text"
                inputMode="numeric"
                value={formatAmount(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full rounded-xl border-0 bg-[#e8edf3] py-3 pl-11 pr-4 text-sm font-semibold text-slate-600 outline-none shadow-[inset_3px_3px_7px_rgba(174,184,196,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* DATE */}

          <div>
            <label
              htmlFor="personal-date"
              className="mb-2 block text-xs font-semibold text-slate-500"
            >
              Date
            </label>

            <input
              id="personal-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border-0 bg-[#e8edf3] px-4 py-3 text-sm font-semibold text-slate-600 outline-none shadow-[inset_3px_3px_7px_rgba(174,184,196,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.9)]"
            />
          </div>

          {/* NOTE */}

          <div>
            <label
              htmlFor="personal-note"
              className="mb-2 block text-xs font-semibold text-slate-500"
            >
              Note
            </label>

            <input
              id="personal-note"
              type="text"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder="Optional"
              className="w-full rounded-xl border-0 bg-[#e8edf3] px-4 py-3 text-sm font-semibold text-slate-600 outline-none shadow-[inset_3px_3px_7px_rgba(174,184,196,0.35),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] placeholder:text-slate-300"
            />
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-500">
              {error}
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="soft-button rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-indigo-400 px-5 py-3 text-xs font-semibold text-white shadow-[4px_4px_10px_rgba(174,184,196,0.35),-3px_-3px_8px_rgba(255,255,255,0.8)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}