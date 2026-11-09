export const scorecardErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Could not save scorecard changes. Please try again.';
};

export const scoreFromDraft = (value: string): number | null => {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const score = Number(normalized);
  return Number.isInteger(score) && score >= 0 && score <= 30 ? score : null;
};

export const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

/** Holes with a score entered (score > 0). */
export const holesPlayed = (score: Record<string, number> | null | undefined): number =>
  HOLES.filter((hole) => (score?.[`H${hole}`] ?? 0) > 0).length;

/** First hole nobody has scored yet (1 if the card is empty, 18 if it is full). */
export const nextOpenHole = (scores: Array<Record<string, number> | null | undefined>): number => {
  const open = HOLES.find((hole) => scores.some((s) => (s?.[`H${hole}`] ?? 0) === 0));
  return open ?? 18;
};

/**
 * Stepper: the first "+" on an empty hole jumps to 4 (a typical par) so most holes
 * need one or two taps; "-" never goes below 0 (0 = not played yet).
 */
export const stepScore = (current: number, direction: 1 | -1): number => {
  if (current === 0) return direction === 1 ? 4 : 0;
  return Math.max(0, Math.min(30, current + direction));
};

/**
 * WHS score differential for a completed 18-hole round, or null until all 18
 * holes are scored and the course rating/slope are known.
 */
export const roundDifferential = (
  score: Record<string, number> | null | undefined,
  courseRating: number | null | undefined,
  slope: number | null | undefined
): number | null => {
  if (!courseRating || !slope || holesPlayed(score) < 18) return null;
  const gross = HOLES.reduce((sum, hole) => sum + (score?.[`H${hole}`] ?? 0), 0);
  return Math.round((((gross - courseRating) * 113) / slope) * 10) / 10;
};
