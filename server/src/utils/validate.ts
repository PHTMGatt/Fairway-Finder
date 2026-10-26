// server/src/utils/validate.ts

import { UserInputError } from 'apollo-server-errors';

/**
 * Note; Limits on what a user can write. Checked in resolvers (not the Mongoose schema)
 * so existing documents are never re-validated against them when saved.
 */
export const LIMITS = {
  username: 40,
  tripName: 80,
  tripDate: 40,
  courseName: 150,
  courseSource: 40,
  courseProviderId: 200,
  courseAddress: 300,
  golfCourseApiId: 100,
  courseLatitude: { min: -90, max: 90 },
  courseLongitude: { min: -180, max: 180 },
  courseDisplayRating: { min: 0, max: 5 },
  playerName: 40,
  coursesPerTrip: 20,
  playersPerTrip: 24,
  hole: { min: 1, max: 18 },
  score: { min: 0, max: 30 },
  handicap: { min: -10, max: 54 }, // Note; plus handicaps are stored as negatives
} as const;

/**
 * Note; Require non-blank text no longer than max (measured after trimming).
 */
export const checkText = (value: string, field: string, label: string, max: number) => {
  const length = value.trim().length;
  if (length === 0 || length > max) {
    throw new UserInputError(`${label} must be 1 to ${max} characters`, { invalidArgs: [field] });
  }
};

/**
 * Require a strict YYYY-MM-DD value that also exists on the calendar. UTC is used so
 * validation cannot change with the server timezone.
 */
export const checkISODate = (value: string, field: string, label: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new UserInputError(`${label} must be a valid YYYY-MM-DD date`, {
      invalidArgs: [field],
    });
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new UserInputError(`${label} must be a valid YYYY-MM-DD date`, {
      invalidArgs: [field],
    });
  }
};

/**
 * Note; Require a number within [min, max]; integers only when integer is true.
 */
export const checkRange = (
  value: number,
  field: string,
  label: string,
  { min, max }: { min: number; max: number },
  integer = false
) => {
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new UserInputError(`${label} must be between ${min} and ${max}`, { invalidArgs: [field] });
  }
};
