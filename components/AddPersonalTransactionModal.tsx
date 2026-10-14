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
    editingTransaction?.type ?? "deposit",
  );

  const [amount, setAmount] = useState(
    editingTransaction ? String(editingTransaction.amount) : "",
  );

  const [date, setDate] = useState(
    editingTransaction?.transaction_date ??
      new Date().toISOString().split("T")[0],
  );

  const [note, setNote] = useState(editingTransaction?.note ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.replace(/\D/g, "");
    setAmount(value);
  }

  function formatAmount(value: string) {
    if (!value) {
      return "";
    }

    return new Intl.NumberFormat("id-ID").format(Number(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      const response = await fetch("/api/personal-savings", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? {
                transactionId: editingTransaction?.id,
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
              },
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${isEditing ? "update" : "save"} transaction.`,
        );
      }

      window.location.href = "/personal";
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditing ? "update" : "save"} transaction.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-[var(--surface-raised)] p-5 shadow-[8px_8px_24px_rgba(174,184,196,0.35),-8px_-8px_24px_rgba(255,255,255,0.9)] sm:p-6">
        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <p className="mt-1 text-xs text-[var(--muted)]">
              {isEditing
                ? "Update your personal savings transaction."
                : "Record a personal savings transaction."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TYPE */}

          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--muted)]">
              Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("deposit")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  type === "deposit"
                    ? "bg-white text-emerald-500 shadow-[inset_2px_2px_5px_rgba(--shadow-dark),inset_-2px_-2px_5px_rgba(--shadow-light)]"
                    : "soft-button text-[var(--muted)]"
                }`}
              >
                Deposit
              </button>

              <button
                type="button"
                onClick={() => setType("withdrawal")}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  type === "withdrawal"
                    ? "bg-white text-[var(--primary)] shadow-[inset_2px_2px_5px_rgba(--shadow-dark),inset_-2px_-2px_5px_rgba(--shadow-light)]"
                    : "soft-button text-[var(--muted)]"
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
              className="mb-2 block text-xs font-semibold text-[var(--muted)]"
            >
              Amount
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
                Rp
              </span>

              <input
                id="personal-amount"
                type="text"
                inputMode="numeric"
                value={formatAmount(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full rounded-xl border-0 bg-[var(--surface-raised)] py-3 pl-11 pr-4 text-sm font-semibold text-[var(--foreground)] outline-none shadow-[inset_3px_3px_7px_rgba(--shadow-dark),inset_-3px_-3px_7px_rgba(--shadow-light)] placeholder:text-[var(--muted)]"
              />
            </div>
          </div>

          {/* DATE */}

          <div>
            <label
              htmlFor="personal-date"
              className="mb-2 block text-xs font-semibold text-[var(--muted)]"
            >
              Date
            </label>

            <input
              id="personal-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border-0 bg-[var(--surface-raised)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] outline-none shadow-[inset_3px_3px_7px_rgba(--shadow-dark),inset_-3px_-3px_7px_rgba(--shadow-light)]"
            />
          </div>

          {/* NOTE */}

          <div>
            <label
              htmlFor="personal-note"
              className="mb-2 block text-xs font-semibold text-[var(--muted)]"
            >
              Note
            </label>

            <input
              id="personal-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border-0 bg-[var(--surface-raised)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] outline-none shadow-[inset_3px_3px_7px_rgba(--shadow-dark),inset_-3px_-3px_7px_rgba(--shadow-light)] placeholder:text-[var(--muted)]"
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
              className="soft-button rounded-xl px-4 py-3 text-xs font-semibold text-[var(--muted)] transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-semibold text-white shadow-[4px_4px_10px_rgba(--shadow-dark),-3px_-3px_8px_rgba(--shadow-light)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
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
