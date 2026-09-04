"use client";

import { useState } from "react";

type Props = {
  currentTarget: number;
};

export default function ChangeTarget({ currentTarget }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState(currentTarget.toString());
  const [isSaving, setIsSaving] = useState(false);

  function openModal() {
    setTarget(currentTarget.toString());
    setIsOpen(true);
  }

  function closeModal() {
    if (!isSaving) {
      setIsOpen(false);
    }
  }

  async function handleSave() {
    const newTarget = Number(target);

    if (!newTarget || newTarget <= 0) {
      alert("Please enter a valid target amount.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/settings/target", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetAmount: newTarget,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update target.");
      }

      setIsOpen(false);

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert("Failed to update target.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="soft-button px-4 py-2 text-xs font-semibold text-slate-500 lg:px-3 lg:py-1.5 lg:text-[10px]"
      >
        Change Target
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm">
          <div className="soft-card w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-700">
                  Change Target
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Set your new HANAN savings target.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="soft-button flex h-9 w-9 items-center justify-center rounded-xl text-slate-400"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <label className="text-xs font-bold tracking-wider text-slate-400">
                TARGET AMOUNT
              </label>

              <div className="soft-card-inset mt-2 flex items-center rounded-2xl px-4">
                <span className="mr-2 text-sm font-semibold text-slate-400">
                  Rp
                </span>

                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  className="w-full bg-transparent py-3 text-lg font-bold text-slate-700 outline-none"
                  placeholder="5000000"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="soft-button rounded-xl px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-indigo-400 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}