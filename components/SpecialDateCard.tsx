import {
  CalendarDays,
  Cake,
  Flower2,
  Gem,
  Heart,
  Pencil,
  PartyPopper,
  Trash2,
  type LucideIcon,
} from "lucide-react";

type SpecialDateCardProps = {
  title: string;
  date: string;
  icon: string;
  description?: string | null;
  countdown: string;
  isToday?: boolean;
  elapsedDays?: number;

  // Custom date actions
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  cake: Cake,
  calendar: CalendarDays,
  party: PartyPopper,
  flower: Flower2,
  gem: Gem,
};

export default function SpecialDateCard({
  title,
  date,
  icon,
  description,
  countdown,
  isToday = false,
  elapsedDays,
  isCustom = false,
  onEdit,
  onDelete,
}: SpecialDateCardProps) {
  const Icon = iconMap[icon] ?? CalendarDays;

  return (
    <div
      className="
        soft-card
        relative
        overflow-hidden
        rounded-3xl
        p-6
        max-md:rounded-2xl
        max-md:p-4
      "
    >
      {/* DECORATION */}

      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-32
          w-32
          rounded-full
          bg-indigo-100/60
          max-md:-right-6
          max-md:-top-6
          max-md:h-20
          max-md:w-20
        "
      />

      <div className="relative">
        {/* ICON */}

        <div className="flex items-start justify-between">
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-indigo-50
              text-indigo-400
              shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]
              max-md:h-10
              max-md:w-10
              max-md:rounded-xl
            "
          >
            <Icon
              size={26}
              strokeWidth={1.8}
              className="max-md:h-5 max-md:w-5"
            />
          </div>

          {/* CUSTOM ACTIONS */}

          {isCustom && (
            <div className="flex items-center gap-2 max-md:gap-1">
              <button
                type="button"
                onClick={onEdit}
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
                  hover:text-indigo-500
                  max-md:h-7
                  max-md:w-7
                  max-md:rounded-lg
                "
                title="Edit"
              >
                <Pencil
                  size={15}
                  strokeWidth={2}
                  className="max-md:h-3.5 max-md:w-3.5"
                />
              </button>

              <button
                type="button"
                onClick={onDelete}
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
                  hover:text-rose-400
                  max-md:h-7
                  max-md:w-7
                  max-md:rounded-lg
                "
                title="Delete"
              >
                <Trash2
                  size={15}
                  strokeWidth={2}
                  className="max-md:h-3.5 max-md:w-3.5"
                />
              </button>
            </div>
          )}
        </div>

        {/* CONTENT */}

        <h2
          className="
            mt-5
            text-xl
            font-bold
            text-slate-700
            max-md:mt-3
            max-md:text-sm
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-2
            text-sm
            font-medium
            text-slate-400
            max-md:mt-1
            max-md:text-[11px]
          "
        >
          {date}
        </p>

        {description && (
          <p
            className="
              mt-3
              text-sm
              leading-relaxed
              text-slate-400
              max-md:mt-2
              max-md:text-[11px]
            "
          >
            {description}
          </p>
        )}

        {/* COUNTDOWN */}

        <div
          className="
            mt-6
            rounded-2xl
            bg-indigo-50
            px-4
            py-3
            text-center
            max-md:mt-4
            max-md:rounded-xl
            max-md:px-2
            max-md:py-2
          "
        >
          <p
            className="
              text-sm
              font-semibold
              text-indigo-500
              max-md:text-[10px]
              max-md:leading-tight
            "
          >
            {countdown}
          </p>
        </div>
      </div>
    </div>
  );
}