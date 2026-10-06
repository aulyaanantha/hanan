export type RepeatType = "none" | "monthly" | "yearly";

type DateInfo = {
  days: number;
  isPast: boolean;
  isToday: boolean;
  label: string;
};

function parseDate(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(year, month - 1, day),
  );
}

function formatDateUTC(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getTodayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function differenceInDays(
  fromDate: Date,
  toDate: Date,
) {
  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.round(
    (toDate.getTime() - fromDate.getTime()) /
      millisecondsPerDay,
  );
}

/**
 * Membuat tanggal occurrence bulanan.
 *
 * Contoh:
 * 31 Januari → 28 Februari
 * 31 Maret → 30 April
 * 31 Mei → 30 Juni
 */
function getMonthlyOccurrence(
  originalDate: string,
  year: number,
  monthIndex: number,
) {
  const original = parseDate(originalDate);
  const originalDay = original.getUTCDate();

  // Hari terakhir dari bulan yang dituju.
  const lastDayOfMonth = new Date(
    Date.UTC(
      year,
      monthIndex + 1,
      0,
    ),
  ).getUTCDate();

  const day = Math.min(
    originalDay,
    lastDayOfMonth,
  );

  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
    ),
  );
}

/**
 * Mengambil occurrence monthly berikutnya.
 */
export function getNextMonthlyOccurrence(
  originalDate: string,
  todayString = getTodayJakarta(),
) {
  const today = parseDate(todayString);

  const currentYear =
    today.getUTCFullYear();

  const currentMonth =
    today.getUTCMonth();

  let occurrence = getMonthlyOccurrence(
    originalDate,
    currentYear,
    currentMonth,
  );

  // Kalau occurrence bulan ini sudah lewat,
  // ambil bulan berikutnya.
  if (occurrence.getTime() < today.getTime()) {
    let nextYear = currentYear;
    let nextMonth = currentMonth + 1;

    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    occurrence = getMonthlyOccurrence(
      originalDate,
      nextYear,
      nextMonth,
    );
  }

  return occurrence;
}

/**
 * Mengambil occurrence yearly berikutnya.
 */
export function getNextYearlyOccurrence(
  originalDate: string,
  todayString = getTodayJakarta(),
) {
  const original = parseDate(originalDate);
  const today = parseDate(todayString);

  const currentYear =
    today.getUTCFullYear();

  let occurrence = new Date(
    Date.UTC(
      currentYear,
      original.getUTCMonth(),
      original.getUTCDate(),
    ),
  );

  if (occurrence.getTime() < today.getTime()) {
    occurrence = new Date(
      Date.UTC(
        currentYear + 1,
        original.getUTCMonth(),
        original.getUTCDate(),
      ),
    );
  }

  return occurrence;
}

/**
 * Mengambil occurrence berikutnya berdasarkan repeat type.
 */
export function getNextOccurrence(
  originalDate: string,
  repeatType: RepeatType,
  todayString = getTodayJakarta(),
) {
  const today = parseDate(todayString);

  if (repeatType === "monthly") {
    return getNextMonthlyOccurrence(
      originalDate,
      todayString,
    );
  }

  if (repeatType === "yearly") {
    return getNextYearlyOccurrence(
      originalDate,
      todayString,
    );
  }

  // Doesn't repeat → gunakan tanggal asli.
  return parseDate(originalDate);
}

/**
 * Menghasilkan informasi countdown.
 */
export function getDateInfo(
  originalDate: string,
  repeatType: RepeatType,
  todayString = getTodayJakarta(),
): DateInfo {
  const today = parseDate(todayString);

  // Untuk one-time date.
  if (repeatType === "none") {
    const target = parseDate(originalDate);

    const days = differenceInDays(
      today,
      target,
    );

    if (days === 0) {
      return {
        days: 0,
        isPast: false,
        isToday: true,
        label: "Today!",
      };
    }

    if (days < 0) {
      const passedDays = Math.abs(days);

      return {
        days: passedDays,
        isPast: true,
        isToday: false,
        label:
          passedDays === 1
            ? "Passed 1 day ago"
            : `Passed ${passedDays} days ago`,
      };
    }

    return {
      days,
      isPast: false,
      isToday: false,
      label:
        days === 1
          ? "1 day to go"
          : `${days} days to go`,
    };
  }

  // Untuk monthly dan yearly.
  const occurrence = getNextOccurrence(
    originalDate,
    repeatType,
    todayString,
  );

  const days = differenceInDays(
    today,
    occurrence,
  );

  if (days === 0) {
    return {
      days: 0,
      isPast: false,
      isToday: true,
      label: "Today!",
    };
  }

  return {
    days,
    isPast: false,
    isToday: false,
    label:
      days === 1
        ? "1 day to go"
        : `${days} days to go`,
  };
}

/**
 * Backward compatibility untuk yearly.
 */
export function getYearlyDateInfo(
  originalDate: string,
  todayString = getTodayJakarta(),
) {
  return getDateInfo(
    originalDate,
    "yearly",
    todayString,
  );
}

export function getDaysSince(
  originalDate: string,
  todayString = getTodayJakarta(),
) {
  const original = parseDate(originalDate);
  const today = parseDate(todayString);

  return Math.max(
    0,
    differenceInDays(original, today),
  );
}

export function formatSpecialDate(
  dateString: string,
) {
  const date = parseDate(dateString);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getOccurrenceDateString(
  originalDate: string,
  repeatType: RepeatType,
  todayString = getTodayJakarta(),
) {
  return formatDateUTC(
    getNextOccurrence(
      originalDate,
      repeatType,
      todayString,
    ),
  );
}