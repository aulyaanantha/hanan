export function getJakartaGreeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(now));
  if (hour >= 5 && hour < 11) return { period: "morning", message: "Good morning, sunshine" } as const;
  if (hour >= 11 && hour < 15) return { period: "afternoon", message: "Good afternoon, my favorite person" } as const;
  if (hour >= 15 && hour < 18) return { period: "evening", message: "A little golden hour, a little us" } as const;
  return { period: "night", message: "Good evening, my favorite person" } as const;
}
