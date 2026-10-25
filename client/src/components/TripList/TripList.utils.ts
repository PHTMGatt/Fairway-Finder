export interface TripDeleteTarget {
  _id: string;
  name: string;
}

export type DeleteTripMutation = (options: {
  variables: { tripId: string };
}) => Promise<unknown>;

const DEFAULT_DELETE_ERROR = 'Could not delete trip. Please try again.';

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
