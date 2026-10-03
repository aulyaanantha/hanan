// lib/recap-utils.ts

export function getPreviousMonth() {
  const now = new Date();

  // Ambil tahun & bulan berdasarkan waktu Jakarta
  const jakartaDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);

  const year = Number(
    jakartaDate.find((part) => part.type === "year")?.value,
  );

  const month = Number(
    jakartaDate.find((part) => part.type === "month")?.value,
  );

  // month dari Intl = 1-12
  // Date.UTC menggunakan month = 0-11
  return new Date(Date.UTC(year, month - 2, 1));
}

export function getMonthRange(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1));

  const end = new Date(Date.UTC(year, month + 1, 1));

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}