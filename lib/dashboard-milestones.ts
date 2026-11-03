export const TARGET_MILESTONES = [25, 50, 75, 100] as const;
export type TargetMilestone = (typeof TARGET_MILESTONES)[number];

export function getNewMilestone(percentage: number, previous: number): TargetMilestone | null {
  if (!Number.isFinite(percentage)) return null;
  const highest = [...TARGET_MILESTONES].reverse().find(value => percentage >= value);
  return highest && highest > previous ? highest : null;
}
