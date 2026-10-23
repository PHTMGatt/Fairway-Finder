export const scorecardErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Could not save scorecard changes. Please try again.';
};
