export type CelebrationCategory = "national" | "religious" | "international";
export type Celebration = { id: number; name: string; date: string; category: CelebrationCategory; description: string; source: string };

export function jakartaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function formatCelebrationDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

export function celebrationMessage(name: string) {
  if (/idul\s*fitri/i.test(name)) return { title: "Eid Mubarak! 🌙", body: "Wishing you and your family peace, joy, and blessings. ❤️" };
  if (/idul\s*adha/i.test(name)) return { title: "Eid Mubarak! 🌙", body: "Wishing you a blessed Eid al-Adha filled with peace and kindness. ❤️" };
  return { title: `✨ ${name}`, body: `Today is ${name}. ❤️` };
}
