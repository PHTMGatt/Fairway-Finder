interface PlanTripFormStateInput {
  tripName: string;
  tripDate: string;
  hasSelectedCourse: boolean;
  savingTrip: boolean;
}

interface PlanTripFormState {
  canSave: boolean;
  helperText: string;
}

export const getPlanTripFormState = ({
  tripName,
  tripDate,
  hasSelectedCourse,
  savingTrip,
}: PlanTripFormStateInput): PlanTripFormState => {
  const hasName = Boolean(tripName.trim());
  const hasDate = Boolean(tripDate);
  const fieldsReady = hasSelectedCourse && hasName && hasDate;

  if (!fieldsReady) {
    const missing: string[] = [];
    if (!hasSelectedCourse) missing.push('choose a course');
    if (!hasName) missing.push('add a trip name');
    if (!hasDate) missing.push('pick a play date');

    if (missing.length === 1) {
      return {
        canSave: false,
        helperText: `${missing[0][0].toUpperCase()}${missing[0].slice(1)} to save this trip.`,
      };
    }

    const last = missing.pop();
    return {
      canSave: false,
      helperText: `${missing.join(', ').replace(/^./, (value) => value.toUpperCase())}, and ${last} to save this trip.`,
    };
  }

  return {
    canSave: !savingTrip,
    helperText: savingTrip ? 'Saving your trip…' : 'Ready to save this trip.',
  };
};
