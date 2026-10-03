export function getPreviousMonth() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ),
  );
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