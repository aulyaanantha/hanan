export type BirthdayPerson = "Farhan" | "Anantha";

export function getBirthdayPerson(title: string): BirthdayPerson | null {
  const normalized = title.trim().replace(/’/g, "'").toLowerCase();
  if (normalized === "farhan's birthday") return "Farhan";
  if (normalized === "anantha's birthday") return "Anantha";
  return null;
}

export function getBirthdayAge(birthDate: string, today: string): number | null {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };
  const birth = parse(birthDate);
  const current = parse(today);
  if (!birth || !current) return null;
  const beforeBirthday = today.slice(5) < birthDate.slice(5);
  const age = current.getUTCFullYear() - birth.getUTCFullYear() - Number(beforeBirthday);
  return age > 0 ? age : null;
}

export function getBirthdayMessage(name: BirthdayPerson, age: number | null, viewer: BirthdayPerson | null) {
  if (viewer === name) {
    return `A year has passed, and you have now reached an age greater than ever before. Happy ${age === null ? "" : `${age} `}birthday, ${name}!!`;
  }
  return age === null
    ? "Today is your partner's birthday. May you continue to celebrate their birthday in the years to come."
    : `Your partner has reached the age of ${age} today. May you continue to celebrate their birthday in the years to come.`;
}
