"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: string;
  amount: number;
  expense_date: string;
  reason: string;
};

type Props = {
  expense?: Expense | null;
  onClose?: () => void;
};

export default function AddOutcomeModal({
  expense = null,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [expenseDate, setExpenseDate] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(expense);

  // --------------------------------
  // OPEN MODAL FOR EDIT
  // --------------------------------

  useEffect(() => {
    if (expense) {
      setExpenseDate(expense.expense_date);
      setReason(expense.reason);
      setAmount(String(expense.amount));
      setIsOpen(true);
    }
  }, [expense]);

  // --------------------------------
  // OPEN MODAL
  // --------------------------------

  function openModal() {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });

    setExpenseDate(today);
    setReason("");
    setAmount("");
    setIsOpen(true);
  }

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------

  function closeModal() {
    if (!isSaving) {
      setIsOpen(false);
      onClose?.();
    }
  }

  // --------------------------------
  // SAVE
  // --------------------------------

  async function handleSave() {
    const numericAmount = Number(amount);

    if (!expenseDate) {
      alert("Please select an expense date.");
      return;
    }

    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/expenses", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isEditing ? { id: expense?.id } : {}),
          expenseDate,
          reason: reason.trim(),
          amount: numericAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save outcome."
        );
      }

      setIsOpen(false);

      onClose?.();

      window.location.href = "/hanan";
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save outcome."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* ADD OUTCOME BUTTON */}

      {!isEditing && (
        <button
          type="button"
          onClick={openModal}
          className="rounded-xl bg-rose-400 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-rose-500"
        >
          + Add Outcome
        </button>
      )}

      {/* MODAL */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm">

          <div className="soft-card w-full max-w-md p-6">

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-lg font-bold text-slate-700">
                  {isEditing
                    ? "Edit Outcome"
                    : "Add Outcome"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {isEditing
                    ? "Update this HANAN expense."
                    : "Record a new HANAN expense."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-lg text-slate-400"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <div className="mt-6 space-y-5">

              {/* DATE */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  DATE
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(event) =>
                      setExpenseDate(event.target.value)
                    }
                    className="w-full bg-transparent py-3 text-sm font-semibold text-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* REASON */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  REASON
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <input
                    type="text"
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    placeholder="e.g. Richeese"
                    className="w-full bg-transparent py-3 text-sm font-semibold text-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* AMOUNT */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  AMOUNT
                </label>

                <div className="soft-card-inset mt-2 flex items-center rounded-2xl px-4">

                  <span className="mr-2 text-sm font-semibold text-slate-400">
                    Rp
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    className="w-full bg-transparent py-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder="50000"
                  />

                </div>
              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="soft-button rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-indigo-400 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Save Outcome"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}