export function getAnniversaryDetails(startDate: string, celebrationDate: string) {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };
  const start = parse(startDate);
  const end = parse(celebrationDate);
  if (!start || !end || end < start) return null;
  const years = end.getUTCFullYear() - start.getUTCFullYear() - Number(celebrationDate.slice(5) < startDate.slice(5));
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  const ordinal = (value: number) => {
    const lastTwo = value % 100;
    return `${value}${lastTwo >= 11 && lastTwo <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th")}`;
  };
  return { years, days, anniversary: ordinal(years) };
}
