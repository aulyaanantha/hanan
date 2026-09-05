"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddPersonalTransactionModal from "@/components/AddPersonalTransactionModal";

export default function PersonalTransactionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="soft-button inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-indigo-500 transition hover:text-indigo-600"
      >
        <Plus size={16} strokeWidth={2} />
        Add Transaction
      </button>

      {isOpen && (
        <AddPersonalTransactionModal
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}