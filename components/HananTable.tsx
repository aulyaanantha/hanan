"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import AddIncomeModal from "@/components/AddIncomeModal";

type Payment = {
  id: string;
  amount: number;
};

type WeeklyData = {
  id: string;
  weekNumber: number;
  targetDate: string;

  farhanPayment: Payment | null;
  ananthaPayment: Payment | null;

  farhanAmount: number;
  ananthaAmount: number;
  total: number;
};

type EditingPayment = {
  id: string;
  person: "Farhan" | "Anantha";
  weekId: string;
  amount: number;
  weekNumber: number;
  targetDate: string;
};

export default function HananTable({
  weeklyData,
}: {
  weeklyData: WeeklyData[];
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const [editingPayment, setEditingPayment] =
    useState<EditingPayment | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [openMenu, setOpenMenu] = useState<{
    type: "edit" | "delete";
    weekId: string;
  } | null>(null);

  const itemsPerPage = 6;

  const totalPages = Math.ceil(
    weeklyData.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentData = weeklyData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  function handleEdit(
    week: WeeklyData,
    person: "Farhan" | "Anantha"
  ) {
    const payment =
      person === "Farhan"
        ? week.farhanPayment
        : week.ananthaPayment;

    if (!payment) {
      return;
    }

    setOpenMenu(null);

    setEditingPayment({
      id: payment.id,
      person,
      weekId: week.id,
      amount: payment.amount,
      weekNumber: week.weekNumber,
      targetDate: week.targetDate,
    });
  }

  async function handleDelete(
    payment: Payment,
    person: "Farhan" | "Anantha",
    weekNumber: number
  ) {
    const confirmed = window.confirm(
      `Delete ${person}'s contribution for M${weekNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setOpenMenu(null);

      const response = await fetch("/api/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete contribution."
        );
      }

      window.location.href = "/hanan";
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete contribution."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleMenu(
    type: "edit" | "delete",
    weekId: string
  ) {
    if (
      openMenu?.type === type &&
      openMenu.weekId === weekId
    ) {
      setOpenMenu(null);
      return;
    }

    setOpenMenu({
      type,
      weekId,
    });
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(174,184,196,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-200/70">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Week
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Target Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Farhan
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Anantha
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-400">
                  Total
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((week) => (
                  <tr
                    key={week.id}
                    className="border-b border-slate-200/40 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-600">
                        M{week.weekNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Intl.DateTimeFormat("en-GB", {
                        timeZone: "Asia/Jakarta",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(week.targetDate))}
                    </td>

                    {/* FARHAN */}

                    <td className="px-5 py-4">
                      {week.farhanAmount > 0 ? (
                        <span className="text-sm font-semibold text-emerald-500">
                          Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            week.farhanAmount
                          )}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-rose-400">
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* ANANTHA */}

                    <td className="px-5 py-4">
                      {week.ananthaAmount > 0 ? (
                        <span className="text-sm font-semibold text-emerald-500">
                          Rp{" "}
                          {new Intl.NumberFormat("id-ID").format(
                            week.ananthaAmount
                          )}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-rose-400">
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* TOTAL */}

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-600">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          week.total
                        )}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4">
                      <div className="relative flex items-center justify-end gap-2">

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleMenu("edit", week.id)
                          }
                          disabled={isDeleting}
                          aria-label={`Edit M${week.weekNumber}`}
                          title="Edit contribution"
                          className="soft-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-indigo-400 disabled:opacity-50"
                        >
                          <Pencil
                            size={15}
                            strokeWidth={2}
                          />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleMenu("delete", week.id)
                          }
                          disabled={isDeleting}
                          aria-label={`Delete M${week.weekNumber}`}
                          title="Delete contribution"
                          className="soft-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-rose-400 disabled:opacity-50"
                        >
                          <Trash2
                            size={15}
                            strokeWidth={2}
                          />
                        </button>

                        {/* EDIT MENU */}

                        {openMenu?.type === "edit" &&
                          openMenu.weekId === week.id && (
                            <div className="absolute right-20 top-10 z-50 w-40 rounded-xl bg-white p-2 shadow-[4px_4px_12px_rgba(174,184,196,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                              <p className="px-3 py-2 text-xs font-semibold text-slate-400">
                                Edit contribution
                              </p>

                              {week.farhanPayment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      week,
                                      "Farhan"
                                    )
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                                >
                                  Farhan
                                </button>
                              )}

                              {week.ananthaPayment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      week,
                                      "Anantha"
                                    )
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                                >
                                  Anantha
                                </button>
                              )}
                            </div>
                          )}

                        {/* DELETE MENU */}

                        {openMenu?.type === "delete" &&
                          openMenu.weekId === week.id && (
                            <div className="absolute right-0 top-10 z-50 w-44 rounded-xl bg-white p-2 shadow-[4px_4px_12px_rgba(174,184,196,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                              <p className="px-3 py-2 text-xs font-semibold text-slate-400">
                                Delete contribution
                              </p>

                              {week.farhanPayment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      week.farhanPayment!,
                                      "Farhan",
                                      week.weekNumber
                                    )
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-500"
                                >
                                  Farhan
                                </button>
                              )}

                              {week.ananthaPayment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      week.ananthaPayment!,
                                      "Anantha",
                                      week.weekNumber
                                    )
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-500"
                                >
                                  Anantha
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="flex min-h-[360px] items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-500">
                          No contributions yet
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Add your first HANAN contribution.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(page - 1, 1)
              )
            }
            disabled={currentPage === 1}
            className="soft-button rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-xs font-semibold text-slate-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(page + 1, totalPages)
              )
            }
            disabled={currentPage === totalPages}
            className="soft-button rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingPayment && (
        <AddIncomeModal
          weeklyData={weeklyData}
          editingPayment={editingPayment}
          onClose={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
}