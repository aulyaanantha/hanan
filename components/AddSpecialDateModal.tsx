"use client";

import {
  CalendarDays,
  CalendarPlus,
  Cake,
  Flower2,
  Gem,
  Heart,
  PartyPopper,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RepeatType = "none" | "monthly" | "yearly";

type EditingSpecialDate = {
  id: string;
  title: string;
  date: string;
  icon: string;
  description: string | null;
  repeat_type: RepeatType;
};

type Props = {
  editingDate?: EditingSpecialDate | null;
  onClose?: () => void;
  showAddButton?: boolean;
};

const iconOptions = [
  {
    value: "calendar",
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    value: "heart",
    label: "Heart",
    icon: Heart,
  },
  {
    value: "cake",
    label: "Birthday",
    icon: Cake,
  },
  {
    value: "party",
    label: "Party",
    icon: PartyPopper,
  },
  {
    value: "flower",
    label: "Flower",
    icon: Flower2,
  },
  {
    value: "gem",
    label: "Gem",
    icon: Gem,
  },
];

const repeatOptions = [
  {
    value: "none" as RepeatType,
    title: "Doesn't repeat",
    description: "This date happens only once.",
  },
  {
    value: "monthly" as RepeatType,
    title: "Every month",
    description: "Repeat this date every month.",
  },
  {
    value: "yearly" as RepeatType,
    title: "Every year",
    description: "Repeat this date every year.",
  },
];

export default function AddSpecialDateModal({
  editingDate = null,
  onClose,
  showAddButton = true,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [icon, setIcon] = useState("calendar");
  const [description, setDescription] = useState("");
  const [repeatType, setRepeatType] =
    useState<RepeatType>("none");

  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(editingDate);

  function openModal() {
    if (isEditMode) {
      return;
    }

    setTitle("");
    setDate("");
    setIcon("calendar");
    setDescription("");
    setRepeatType("none");
    setIsOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsOpen(false);

    if (onClose) {
      onClose();
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (!date) {
      alert("Please select a date.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        isEditMode
          ? `/api/special-dates/${editingDate?.id}`
          : "/api/special-dates",
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            date,
            icon,
            description: description.trim() || null,
            repeatType,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            (isEditMode
              ? "Failed to update special date."
              : "Failed to create special date."),
        );
      }

      setIsOpen(false);

      if (onClose) {
        onClose();
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Failed to update special date."
            : "Failed to create special date.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (editingDate) {
      setTitle(editingDate.title);
      setDate(editingDate.date);
      setIcon(editingDate.icon || "calendar");
      setDescription(editingDate.description || "");
      setRepeatType(editingDate.repeat_type);
      setIsOpen(true);
    }
  }, [editingDate]);

  return (
    <>
      {/* ADD BUTTON */}

      {showAddButton && (
        <button
          type="button"
          onClick={openModal}
          className="
            soft-button
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-4
            py-3
            text-xs
            font-semibold
            text-indigo-500
            transition
            hover:text-indigo-600
          "
        >
          <CalendarPlus
            size={16}
            strokeWidth={2}
          />
          Add Special Date
        </button>
      )}

      {/* MODAL */}

      {isOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-900/20
            px-4
            py-6
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="
              soft-card
              max-h-[90vh]
              w-full
              max-w-md
              overflow-y-auto
              rounded-3xl
              p-6
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-700">
                  {isEditMode
                    ? "Edit Special Date"
                    : "Add Special Date"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {isEditMode
                    ? "Update your special date."
                    : "Add an important date to your HANAN calendar."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="
                  soft-button
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-400
                  transition
                  hover:text-slate-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <X
                  size={18}
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* FORM */}

            <div className="mt-6 space-y-5">
              {/* TITLE */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  TITLE
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="e.g. First Date"
                    className="
                      w-full
                      bg-transparent
                      py-3
                      text-sm
                      font-semibold
                      text-slate-600
                      outline-none
                      placeholder:text-slate-300
                    "
                  />
                </div>
              </div>

              {/* DATE */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  DATE
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className="
                      w-full
                      bg-transparent
                      py-3
                      text-sm
                      font-semibold
                      text-slate-600
                      outline-none
                    "
                  />
                </div>
              </div>

              {/* ICON */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  ICON
                </label>

                <div className="mt-2 grid grid-cols-6 gap-2">
                  {iconOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected =
                      icon === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setIcon(option.value)
                        }
                        title={option.label}
                        className={`
                          flex
                          h-12
                          items-center
                          justify-center
                          rounded-2xl
                          transition
                          ${
                            isSelected
                              ? "bg-indigo-100 text-indigo-500 shadow-inner"
                              : "soft-button text-slate-400 hover:text-indigo-400"
                          }
                        `}
                      >
                        <Icon
                          size={20}
                          strokeWidth={1.8}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  DESCRIPTION
                  <span className="ml-1 font-medium normal-case tracking-normal text-slate-300">
                    (optional)
                  </span>
                </label>

                <div className="soft-card-inset mt-2 rounded-2xl px-4">
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={3}
                    placeholder="Add a little note..."
                    className="
                      w-full
                      resize-none
                      bg-transparent
                      py-3
                      text-sm
                      font-medium
                      text-slate-600
                      outline-none
                      placeholder:text-slate-300
                    "
                  />
                </div>
              </div>

              {/* REPEAT */}

              <div>
                <label className="text-xs font-bold tracking-wider text-slate-400">
                  REPEAT
                </label>

                <div className="mt-2 space-y-2">
                  {repeatOptions.map((option) => {
                    const isSelected =
                      repeatType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setRepeatType(option.value)
                        }
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-2xl
                          px-4
                          py-3
                          text-left
                          transition
                          ${
                            isSelected
                              ? "bg-indigo-50 text-indigo-500 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]"
                              : "soft-button text-slate-500 hover:text-indigo-400"
                          }
                        `}
                      >
                        {/* RADIO */}

                        <span
                          className={`
                            flex
                            h-5
                            w-5
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border-2
                            transition
                            ${
                              isSelected
                                ? "border-indigo-400"
                                : "border-slate-300"
                            }
                          `}
                        >
                          {isSelected && (
                            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                          )}
                        </span>

                        <span>
                          <span
                            className={`
                              block
                              text-sm
                              font-semibold
                              ${
                                isSelected
                                  ? "text-indigo-500"
                                  : "text-slate-600"
                              }
                            `}
                          >
                            {option.title}
                          </span>

                          <span className="mt-0.5 block text-xs text-slate-400">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="
                  soft-button
                  rounded-xl
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-slate-500
                  transition
                  hover:text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !title.trim() ||
                  !date
                }
                className="
                  rounded-xl
                  bg-indigo-400
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  shadow-md
                  transition
                  hover:bg-indigo-500
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                    ? "Update Special Date"
                    : "Save Special Date"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}