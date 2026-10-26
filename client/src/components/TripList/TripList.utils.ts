export interface TripDeleteTarget {
  _id: string;
  name: string;
}

export interface TripDisplayTarget {
  date?: string | null;
}

export type DeleteTripMutation = (options: {
  variables: { tripId: string };
}) => Promise<unknown>;

const DEFAULT_DELETE_ERROR = 'Could not delete trip. Please try again.';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const localDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTripDate = (value?: string | null): string => {
  const date = value?.trim() || '';
  if (!date) return 'Date not set';
  if (!ISO_DATE.test(date)) return date;

  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const sortTripsForDisplay = <T extends TripDisplayTarget>(
  trips: T[],
  today = localDateKey()
): T[] =>
  [...trips].sort((left, right) => {
    const leftDate = left.date?.trim() || '';
    const rightDate = right.date?.trim() || '';
    const leftValid = ISO_DATE.test(leftDate);
    const rightValid = ISO_DATE.test(rightDate);
    const leftUpcoming = leftValid && leftDate >= today;
    const rightUpcoming = rightValid && rightDate >= today;

    if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
    if (leftUpcoming && rightUpcoming) return leftDate.localeCompare(rightDate);

    if (leftValid !== rightValid) return leftValid ? 1 : -1;
    if (!leftValid && !rightValid) return 0;

    return rightDate.localeCompare(leftDate);
  });

export const deleteTripWithConfirmation = async (
  trip: TripDeleteTarget,
  deleteTrip: DeleteTripMutation,
  confirmDelete: (message: string) => boolean
): Promise<string | null> => {
  if (!confirmDelete(`Delete "${trip.name}"? This cannot be undone.`)) {
    return null;
  }

  try {
    await deleteTrip({ variables: { tripId: trip._id } });
    return null;
  } catch (error: unknown) {
    return error instanceof Error && error.message
      ? error.message
      : DEFAULT_DELETE_ERROR;
  }
};
