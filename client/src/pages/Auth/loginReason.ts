export const getLoginReasonMessage = (reason: string | null): string | null => {
  if (reason === 'guest_expired') {
    return 'Your Guest Demo expired. Its temporary data has been deleted.';
  }
  if (reason === 'expired') {
    return 'Your session expired. Please log in again.';
  }
  return null;
};
