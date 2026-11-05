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
