"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import AddPersonalTransactionModal from "@/components/AddPersonalTransactionModal";

type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  transaction_date: string;
  note: string | null;
};

type Props = {
  transactions: Transaction[];
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

export default function PersonalSavingsTable({
  transactions,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // 6 transaksi per halaman
  const itemsPerPage = 6;

  // Urutkan transaksi dari terbaru ke terlama
  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime()
  );

  // Hitung jumlah halaman
  const totalPages = Math.ceil(
    sortedTransactions.length / itemsPerPage
  );

  // Tentukan data yang ditampilkan di halaman sekarang
  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const currentTransactions =
    sortedTransactions.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  async function handleDelete(
    transaction: Transaction
  ) {
    const confirmed = window.confirm(
      `Delete this ${transaction.type} transaction?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(
        "/api/personal-savings",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId: transaction.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to delete transaction."
        );
      }

      window.location.href = "/personal";
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete transaction."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-white/60 shadow-[inset_2px_2px_5px_rgba(174,184,196,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-200/70">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Type
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">
                  Note
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-400">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {currentTransactions.length > 0 ? (
                currentTransactions.map(
                  (transaction) => {
                    const isDeposit =
                      transaction.type === "deposit";

                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-200/40 last:border-0"
                      >
                        {/* DATE */}

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {formatDate(
                            transaction.transaction_date
                          )}
                        </td>

                        {/* TYPE */}

                        <td className="px-5 py-4">
                          <span
                            className={
                              isDeposit
                                ? "text-sm font-semibold text-emerald-500"
                                : "text-sm font-semibold text-rose-400"
                            }
                          >
                            {isDeposit
                              ? "Deposit"
                              : "Withdrawal"}
                          </span>
                        </td>

                        {/* NOTE */}

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-600">
                            {transaction.note || ""}
                          </span>
                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-4 text-right">
                          <span
                            className={
                              isDeposit
                                ? "text-sm font-semibold text-emerald-500"
                                : "text-sm font-semibold text-rose-400"
                            }
                          >
                            {isDeposit ? "+" : "-"}
                            {formatRupiah(
                              Number(
                                transaction.amount
                              )
                            )}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingTransaction(
                                  transaction
                                )
                              }
                              disabled={isDeleting}
                              aria-label="Edit transaction"
                              title="Edit transaction"
                              className="soft-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-indigo-400 disabled:opacity-50"
                            >
                              <Pencil
                                size={15}
                                strokeWidth={2}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  transaction
                                )
                              }
                              disabled={isDeleting}
                              aria-label="Delete transaction"
                              title="Delete transaction"
                              className="soft-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-rose-400 disabled:opacity-50"
                            >
                              <Trash2
                                size={15}
                                strokeWidth={2}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="flex min-h-[300px] items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-500">
                          No transactions yet
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Add your first personal
                          savings transaction.
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

      {editingTransaction && (
        <AddPersonalTransactionModal
          editingTransaction={editingTransaction}
          onClose={() =>
            setEditingTransaction(null)
          }
        />
      )}
    </div>
  );
}