"use client";

import { useState } from "react";

import AddSpecialDateModal from "@/components/AddSpecialDateModal";
import SpecialDateCard from "@/components/SpecialDateCard";

type RepeatType = "none" | "monthly" | "yearly";

type SpecialDate = {
  id: string;
  title: string;
  date: string;
  icon: string;
  description: string | null;
  repeat_type: RepeatType;
  countdown: string;
  isToday: boolean;
};

type Props = {
  dates: SpecialDate[];
};

export default function SpecialDatesList({
  dates,
}: Props) {
  const [editingDate, setEditingDate] =
    useState<SpecialDate | null>(null);

  function handleEdit(date: SpecialDate) {
    setEditingDate(date);
  }

  function handleCloseEdit() {
    setEditingDate(null);
  }

  async function handleDelete(date: SpecialDate) {
    const confirmed = window.confirm(
      "Are you sure to delete this special date?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/special-dates/${date.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete special date.",
        );
      }

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete special date.",
      );
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
        {dates.map((specialDate) => (
          <SpecialDateCard
            key={specialDate.id}
            title={specialDate.title}
            date={specialDate.date}
            icon={specialDate.icon}
            description={specialDate.description}
            countdown={specialDate.countdown}
            isToday={specialDate.isToday}
            isCustom
            onEdit={() =>
              handleEdit(specialDate)
            }
            onDelete={() =>
              handleDelete(specialDate)
            }
          />
        ))}
      </div>

      <AddSpecialDateModal
        editingDate={editingDate}
        onClose={handleCloseEdit}
        showAddButton={false}
      />
    </>
  );
}