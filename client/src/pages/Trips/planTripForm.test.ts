import { describe, expect, it } from 'vitest';
import { getPlanTripFormState } from './planTripForm';

describe('Plan Trip form readiness', () => {
  it('explains exactly what is missing before a trip can be saved', () => {
    expect(
      getPlanTripFormState({
        tripName: '',
        tripDate: '',
        hasSelectedCourse: false,
        savingTrip: false,
      })
    ).toEqual({
      canSave: false,
      helperText: 'Choose a course, add a trip name, and pick a play date to save this trip.',
    });
  });

  it('allows saving only when the course, trimmed name, and date are present', () => {
    expect(
      getPlanTripFormState({
        tripName: '  Northern Michigan  ',
        tripDate: '2026-11-08',
        hasSelectedCourse: true,
        savingTrip: false,
      })
    ).toEqual({
      canSave: true,
      helperText: 'Ready to save this trip.',
    });
  });

  it('keeps save disabled while a mutation is in flight', () => {
    expect(
      getPlanTripFormState({
        tripName: 'Weekend',
        tripDate: '2026-11-08',
        hasSelectedCourse: true,
        savingTrip: true,
      }).canSave
    ).toBe(false);
  });
});
