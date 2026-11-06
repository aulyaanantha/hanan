export function getAdjacentMemory<T extends { id: string }>(memories: T[], id: string, direction: -1 | 1): T | null {
  const index = memories.findIndex(memory => memory.id === id);
  if (index < 0) return null;
  return memories[index + direction] ?? null;
}

export function getMemorySwipeDirection(dx: number, dy: number): -1 | 1 | null {
  if (Math.abs(dx) < 50 || Math.abs(dy) > 35 || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? 1 : -1;
}
