"use client";

import { useEffect, useState } from "react";

type WeeklyData = {
  id: string;
  weekNumber: number;
  targetDate: string;
  farhanAmount: number;
  ananthaAmount: number;
  total: number;
};

type EditingPayment = {
  id: string;
  person: "Farhan" | "Anantha";
  weekId: string;
  amount: number;
  paymentDate: string | null;
  weekNumber: number;
  targetDate: string;
};

type Props = {
  weeklyData: WeeklyData[];
  editingPayment?: EditingPayment | null;
  onClose?: () => void;
};

function getTodayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function AddIncomeModal({
  weeklyData,
  editingPayment = null,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [person, setPerson] = useState<"Farhan" | "Anantha">("Anantha");

  const [weekId, setWeekId] = useState("");

  const [paymentDate, setPaymentDate] = useState(getTodayJakarta());

  const [amount, setAmount] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(editingPayment);

  // --------------------------------
  // FIND NEXT UNPAID WEEK
  // --------------------------------

  function findNextUnpaidWeek(selectedPerson: "Farhan" | "Anantha") {
    const sortedWeeks = [...weeklyData].sort(
      (a, b) => a.weekNumber - b.weekNumber,
    );

    const unpaidWeek = sortedWeeks.find((week) => {
      if (selectedPerson === "Farhan") {
        return week.farhanAmount <= 0;
      }

      return week.ananthaAmount <= 0;
    });

    return unpaidWeek?.id ?? "";
  }

  // --------------------------------
  // OPEN ADD MODAL
  // --------------------------------

  function openModal() {
    const firstPerson = "Anantha";

    setPerson(firstPerson);
    setWeekId(findNextUnpaidWeek(firstPerson));
    setPaymentDate(getTodayJakarta());
    setAmount("");
    setIsOpen(true);
  }

  // --------------------------------
  // OPEN EDIT MODAL
  // --------------------------------

  useEffect(() => {
    if (editingPayment) {
      setPerson(editingPayment.person);
      setWeekId(editingPayment.weekId);
      setPaymentDate(editingPayment.paymentDate || getTodayJakarta());
      setAmount(String(editingPayment.amount));
      setIsOpen(true);
    }
  }, [editingPayment]);

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsOpen(false);

    if (onClose) {
      onClose();
    }
  }

  // --------------------------------
  // CHANGE PERSON
  // --------------------------------

  function handlePersonChange(selectedPerson: "Farhan" | "Anantha") {
    setPerson(selectedPerson);

    if (isEditMode) {
      return;
    }

    const nextWeek = findNextUnpaidWeek(selectedPerson);

    setWeekId(nextWeek);
  }

  // --------------------------------
  // SAVE
  // --------------------------------

  async function handleSave() {
    const numericAmount = Number(amount);

    if (!weekId) {
      alert(`${person} has no unpaid week available.`);
      return;
    }

    if (!paymentDate) {
      alert("Please select a payment date.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/payments", {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditMode
            ? {
                paymentId: editingPayment?.id,
                person,
                weekId,
                amount: numericAmount,
                paymentDate,
              }
            : {
                person,
                weekId,
                amount: numericAmount,
                paymentDate,
              },
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            (isEditMode
              ? "Failed to update income."
              : "Failed to save income."),
        );
      }

      setIsOpen(false);

      if (onClose) {
        onClose();
      }

      window.location.href = "/hanan";
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Failed to update income."
            : "Failed to save income.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // --------------------------------
  // SELECTED WEEK INFORMATION
  // --------------------------------

  const selectedWeek = weeklyData.find((week) => week.id === weekId);

  // --------------------------------
  // RENDER
  // --------------------------------

  return (
    <>
      {/* ADD INCOME BUTTON */}

      {!isEditMode && (
        <button
          type="button"
          onClick={openModal}
          className="soft-button inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-[var(--primary)] transition hover:text-[var(--primary-dark)]"
        >
          + Add Income
        </button>
      )}

      {/* MODAL */}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="soft-card w-full max-w-md p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {isEditMode ? "Edit Income" : "Add Income"}
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  {isEditMode
                    ? "Update this HANAN contribution."
                    : "Record a new HANAN contribution."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-lg text-[var(--muted)]"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <div className="mt-6 space-y-5">
              {/* PERSON */}

              <div>
                <label className="text-xs font-bold tracking-wider text-[var(--muted)]">
                  FROM
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <select
                    value={person}
                    onChange={(event) =>
                      handlePersonChange(
                        event.target.value as "Farhan" | "Anantha",
                      )
                    }
                    className="w-full bg-transparent py-3 text-sm font-semibold text-[var(--foreground)] outline-none"
                  >
                    <option value="Anantha">Anantha</option>

                    <option value="Farhan">Farhan</option>
                  </select>
                </div>
              </div>

              {/* WEEK */}

              <div>
                <label className="text-xs font-bold tracking-wider text-[var(--muted)]">
                  WEEK
                </label>

                <div className="soft-card-inset mt-2 flex items-center justify-between rounded-2xl px-4 py-3">
                  {selectedWeek ? (
                    <>
                      <div>
                        <p className="text-sm font-bold text-[var(--foreground)]">
                          M{selectedWeek.weekNumber}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Target date{" "}
                          {new Intl.DateTimeFormat("en-GB", {
                            timeZone: "Asia/Jakarta",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(selectedWeek.targetDate))}
                        </p>
                      </div>

                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">
                        {isEditMode ? "Current week" : "Auto selected"}
                      </span>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-[var(--muted)]">
                        No unpaid week
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {person} has paid all available weeks.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT DATE */}

              <div>
                <label className="text-xs font-bold tracking-wider text-[var(--muted)]">
                  PAYMENT DATE
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className="w-full bg-transparent py-3 text-sm font-semibold text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>

              {/* AMOUNT */}

              <div>
                <label className="text-xs font-bold tracking-wider text-[var(--muted)]">
                  AMOUNT
                </label>

                <div className="soft-card-inset mt-2 flex items-center rounded-2xl px-4">
                  <span className="mr-2 text-sm font-semibold text-[var(--muted)]">
                    Rp
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full bg-transparent py-3 text-sm font-bold text-[var(--foreground)] outline-none"
                    placeholder="25000"
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
                className="soft-button rounded-xl px-4 py-2.5 text-xs font-semibold text-[var(--muted)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !weekId}
                className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                    ? "Update Income"
                    : "Save Income"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
