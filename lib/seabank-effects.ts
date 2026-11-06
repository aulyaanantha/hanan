export type SeaBankSnapshot = { balance: number; interest: number; calculationKey: string };

export function compareSeaBankSnapshots(previous: unknown, current: SeaBankSnapshot) {
  const before = previous as Partial<SeaBankSnapshot> | null;
  if (!before || before.calculationKey !== current.calculationKey ||
    typeof before.balance !== 'number' || !Number.isFinite(before.balance) ||
    typeof before.interest !== 'number' || !Number.isFinite(before.interest) ||
    !Number.isFinite(current.balance) || !Number.isFinite(current.interest)) {
    return { direction: null, interestIncreased: false };
  }
  const delta = Math.round(current.balance) - Math.round(before.balance);
  return {
    direction: delta > 0 ? 'up' as const : delta < 0 ? 'down' as const : null,
    interestIncreased: Math.round(current.interest) > Math.round(before.interest),
  };
}
