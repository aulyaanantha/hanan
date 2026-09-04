"use client";

import { useState } from "react";

type WeeklyData = {
  id: string;
  weekNumber: number;
  targetDate: string;
  farhanAmount: number;
  ananthaAmount: number;
  total: number;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function HananTable({
  weeklyData,
}: {
  weeklyData: WeeklyData[];
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  const totalPages = Math.ceil(weeklyData.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = weeklyData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(174,184,196,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
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
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((week) => (
                  <tr
                    key={week.id}
                    className="border-b border-slate-200/40 last:border-0"
                  >
                    {/* WEEK */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-600">
                        M{week.weekNumber}
                      </span>
                    </td>

                    {/* TARGET DATE */}
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {formatDate(week.targetDate)}
                    </td>

                    {/* FARHAN */}
                    <td className="px-5 py-4">
                      {week.farhanAmount > 0 ? (
                        <span className="text-sm font-semibold text-emerald-500">
                          {formatRupiah(week.farhanAmount)}
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
                          {formatRupiah(week.ananthaAmount)}
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
                        {formatRupiah(week.total)}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* EDIT */}
                        <button
                          type="button"
                          aria-label={`Edit M${week.weekNumber}`}
                          title="Edit"
                          className="soft-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-indigo-400"
                        >
                          <svg
                            className="h-4 w-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4.5m2.409-9.409a2.017 2.017 0 0 0-2.852 0l-8.119 8.119L7 17l3.938-.438 8.118-8.118a2.017 2.017 0 0 0 0-2.852Z"
                            />
                          </svg>
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          aria-label={`Delete M${week.weekNumber}`}
                          title="Delete"
                          className="soft-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-rose-400"
                        >
                          <svg
                            className="h-4 w-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="flex min-h-[360px] items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8edf3] text-2xl text-slate-300 shadow-[inset_4px_4px_8px_rgba(174,184,196,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]">
                          +
                        </div>

                        <p className="mt-5 text-sm font-semibold text-slate-500">
                          No income records yet.
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Click “Add Income” to get started.
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
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="soft-button rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-xs font-medium text-slate-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="soft-button rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
