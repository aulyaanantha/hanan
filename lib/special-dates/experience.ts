import { getDateInfo, type RepeatType } from "./date-utils";
import { getBirthdayPerson, type BirthdayPerson } from "./birthday";

export type DateEffect = {
  id: string; title: string; icon: string; countdown: string; isToday: boolean;
  birthday?: { name: BirthdayPerson; birthDate: string };
  anniversary?: { startDate: string };
};
type SpecialDateRow = { id: string; title: string; date: string; repeat_type: RepeatType; icon: string | null; type: string; is_featured: boolean };

export function buildSpecialDateEffects(rows: SpecialDateRow[], today: string): DateEffect[] {
  return rows.map(row => {
    const info = getDateInfo(row.date, row.repeat_type, today);
    const name = row.is_featured ? getBirthdayPerson(row.title) : null;
    const anniversary = row.is_featured && (row.type === "anniversary" || row.title === "Our Anniversary");
    return {
      id: row.id, title: row.title, icon: row.icon ?? "calendar", countdown: info.label, isToday: info.isToday,
      birthday: name ? { name, birthDate: row.date } : undefined,
      anniversary: anniversary ? { startDate: row.date } : undefined,
    };
  });
}
