export const readAddToTripId = (state: unknown): string | null => {
  if (!state || typeof state !== 'object') return null;

  const value = (state as { addToTripId?: unknown }).addToTripId;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed || null;
};
