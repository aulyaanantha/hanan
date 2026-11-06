export function readDateEffects(raw: string | null, today: string) {
  const labels: Record<string, string> = {};
  let celebrated: string[] = [];
  try {
    const value = JSON.parse(raw || "{}");
    if (value?.labels && typeof value.labels === "object") {
      for (const [id, label] of Object.entries(value.labels)) {
        if (typeof label === "string") labels[id] = label;
      }
    }
    if (value?.day === today && Array.isArray(value.celebrated)) {
      celebrated = value.celebrated.filter((id: unknown): id is string => typeof id === "string");
    }
  } catch { /* Corrupted optional storage must never block the page. */ }
  return { labels, celebrated };
}

export function shouldShowDateCelebration(lastShown: string | null, today: string, dates: { isToday: boolean }[]) {
  return lastShown !== today && dates.some(date => date.isToday);
}
