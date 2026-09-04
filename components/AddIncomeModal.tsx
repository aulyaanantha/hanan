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

type Props = {
  weeklyData: WeeklyData[];
};

export default function AddIncomeModal({
  weeklyData,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [person, setPerson] = useState<"Farhan" | "Anantha">(
    "Anantha"
  );

  const [weekId, setWeekId] = useState("");

  const [amount, setAmount] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------
  // FIND NEXT UNPAID WEEK
  // --------------------------------

  function findNextUnpaidWeek(
    selectedPerson: "Farhan" | "Anantha"
  ) {
    const sortedWeeks = [...weeklyData].sort(
      (a, b) => a.weekNumber - b.weekNumber
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
  // OPEN MODAL
  // --------------------------------

  function openModal() {
    const firstPerson = "Anantha";

    setPerson(firstPerson);
    setWeekId(findNextUnpaidWeek(firstPerson));
    setAmount("");
    setIsOpen(true);
  }

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------

  function closeModal() {
    if (!isSaving) {
      setIsOpen(false);
    }
  }

  // --------------------------------
  // CHANGE PERSON
  // --------------------------------

  function handlePersonChange(
    selectedPerson: "Farhan" | "Anantha"
  ) {
    setPerson(selectedPerson);

    const nextWeek = findNextUnpaidWeek(selectedPerson);

    setWeekId(nextWeek);
  }

  // --------------------------------
  // SAVE
  // --------------------------------

  async function handleSave() {
    const numericAmount = Number(amount);

    if (!weekId) {
      alert(
        `${person} has no unpaid week available.`
      );
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person,
          weekId,
          amount: numericAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save income."
        );
      }

      setIsOpen(false);

      window.location.href = "/hanan";
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save income."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // --------------------------------
  // SELECTED WEEK INFORMATION
  // --------------------------------

  const selectedWeek = weeklyData.find(
    (week) => week.id === weekId
  );

  return (
    <>
      {/* ADD INCOME BUTTON */}

      <button
        type="button"
        onClick={openModal}
        className="rounded-xl bg-indigo-400 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500"
      >
        + Add Income
      </button>

      {/* MODAL */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm">

          <div className="soft-card w-full max-w-md p-6">

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="text-lg font-bold text-slate-700">
                  Add Income
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Record a new HANAN contribution.
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

              {/* PERSON */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  FROM
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <select
                    value={person}
                    onChange={(event) =>
                      handlePersonChange(
                        event.target.value as
                          | "Farhan"
                          | "Anantha"
                      )
                    }
                    className="w-full bg-transparent py-3 text-sm font-semibold text-slate-600 outline-none"
                  >
                    <option value="Anantha">
                      Anantha
                    </option>

                    <option value="Farhan">
                      Farhan
                    </option>
                  </select>
                </div>
              </div>

              {/* AUTO WEEK */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  WEEK
                </label>

                <div className="soft-card-inset mt-2 flex items-center justify-between rounded-2xl px-4 py-3">

                  {selectedWeek ? (
                    <>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          M{selectedWeek.weekNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Target date{" "}
                          {new Intl.DateTimeFormat(
                            "en-GB",
                            {
                              timeZone:
                                "Asia/Jakarta",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          ).format(
                            new Date(
                              selectedWeek.targetDate
                            )
                          )}
                        </p>
                      </div>

                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-500">
                        Auto selected
                      </span>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        No unpaid week
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {person} has paid all available weeks.
                      </p>
                    </div>
                  )}

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
                className="soft-button rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !weekId}
                className="rounded-xl bg-indigo-400 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Income"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}