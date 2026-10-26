interface IdLike {
  toString(): string;
}

interface ProfileReferenceSnapshot {
  _id: IdLike | string;
  trips?: Array<IdLike | string>;
}

interface TripCourseSnapshot {
  name?: string | null;
  source?: string | null;
  providerId?: string | null;
  location?: { lat?: number; lng?: number } | null;
  rating?: number | null;
  slope?: number | null;
}

interface ScoreSnapshot {
  hole?: number | null;
  score?: number | null;
}

interface PlayerSnapshot {
  name?: string | null;
  scores?: ScoreSnapshot[];
}

interface TripReferenceSnapshot {
  _id: IdLike | string;
  date?: string | null;
  courses?: TripCourseSnapshot[];
  players?: PlayerSnapshot[];
}

interface DanglingReference {
  profileId: string;
  tripId: string;
}

export interface TripReferenceIntegrityReport {
  profiles: number;
  trips: number;
  references: number;
  resolvedReferences: number;
  danglingReferences: number;
  duplicateReferences: number;
  orphanTrips: number;
  multiOwnedTrips: number;
  dangling: DanglingReference[];
  orphanTripIds: string[];
  multiOwnedTripIds: string[];
}

export interface TripDataIntegrityReport {
  trips: number;
  tripsWithoutCourses: number;
  invalidDateTrips: number;
  duplicateCourseTrips: number;
  invalidLocationTrips: number;
  invalidDisplayRatingTrips: number;
  invalidSlopeTrips: number;
  tripIdsWithoutCourses: string[];
  invalidDateTripIds: string[];
  duplicateCourseTripIds: string[];
  invalidLocationTripIds: string[];
  invalidDisplayRatingTripIds: string[];
  invalidSlopeTripIds: string[];
}

export interface TripPlayerIntegrityReport {
  trips: number;
  duplicatePlayerTrips: number;
  malformedScorecardTrips: number;
  duplicatePlayerTripIds: string[];
  malformedScorecardTripIds: string[];
}

const asId = (value: IdLike | string): string => value.toString();
const trimmed = (value?: string | null) => value?.trim() ?? '';

const isValidISODate = (value?: string | null): boolean => {
  if (!value) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const courseIdentity = (course: TripCourseSnapshot): string | null => {
  const source = trimmed(course.source);
  const providerId = trimmed(course.providerId);
  if (source && providerId) return `provider:${source}\u0000${providerId}`;

  const name = trimmed(course.name).toLowerCase();
  return name ? `name:${name}` : null;
};

const hasInvalidLocation = (course: TripCourseSnapshot): boolean => {
  if (course.location == null) return false;
  const { lat, lng } = course.location;
  return (
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  );
};

const hasInvalidDisplayRating = (course: TripCourseSnapshot): boolean =>
  course.rating != null &&
  (typeof course.rating !== 'number' ||
    !Number.isFinite(course.rating) ||
    course.rating < 0 ||
    course.rating > 5);

const hasInvalidSlope = (course: TripCourseSnapshot): boolean =>
  course.slope != null &&
  (typeof course.slope !== 'number' ||
    !Number.isInteger(course.slope) ||
    course.slope < 55 ||
    course.slope > 155);

const hasMalformedScorecard = (player: PlayerSnapshot): boolean => {
  const scores = player.scores ?? [];
  if (scores.length !== 18) return true;

  const seenHoles = new Set<number>();
  for (const entry of scores) {
    if (
      typeof entry.hole !== 'number' ||
      !Number.isInteger(entry.hole) ||
      entry.hole < 1 ||
      entry.hole > 18 ||
      typeof entry.score !== 'number' ||
      !Number.isInteger(entry.score) ||
      entry.score < 0 ||
      entry.score > 30 ||
      seenHoles.has(entry.hole)
    ) {
      return true;
    }
    seenHoles.add(entry.hole);
  }

  return seenHoles.size !== 18;
};

export const analyzeTripReferenceIntegrity = (
  profiles: ProfileReferenceSnapshot[],
  trips: TripReferenceSnapshot[]
): TripReferenceIntegrityReport => {
  const tripIds = trips.map((trip) => asId(trip._id));
  const existingTripIds = new Set(tripIds);
  const ownerIdsByTrip = new Map<string, Set<string>>();
  const dangling: DanglingReference[] = [];

  let references = 0;
  let resolvedReferences = 0;
  let duplicateReferences = 0;

  for (const profile of profiles) {
    const profileId = asId(profile._id);
    const seenByProfile = new Set<string>();

    for (const reference of profile.trips ?? []) {
      const tripId = asId(reference);
      references += 1;

      if (seenByProfile.has(tripId)) {
        duplicateReferences += 1;
      } else {
        seenByProfile.add(tripId);
      }

      if (!existingTripIds.has(tripId)) {
        dangling.push({ profileId, tripId });
        continue;
      }

      resolvedReferences += 1;
      if (!ownerIdsByTrip.has(tripId)) ownerIdsByTrip.set(tripId, new Set());
      ownerIdsByTrip.get(tripId)?.add(profileId);
    }
  }

  dangling.sort((left, right) =>
    left.profileId.localeCompare(right.profileId) || left.tripId.localeCompare(right.tripId)
  );

  const orphanTripIds = tripIds
    .filter((tripId) => (ownerIdsByTrip.get(tripId)?.size ?? 0) === 0)
    .sort();
  const multiOwnedTripIds = tripIds
    .filter((tripId) => (ownerIdsByTrip.get(tripId)?.size ?? 0) > 1)
    .sort();

  return {
    profiles: profiles.length,
    trips: trips.length,
    references,
    resolvedReferences,
    danglingReferences: dangling.length,
    duplicateReferences,
    orphanTrips: orphanTripIds.length,
    multiOwnedTrips: multiOwnedTripIds.length,
    dangling,
    orphanTripIds,
    multiOwnedTripIds,
  };
};

export const analyzeTripDataIntegrity = (
  trips: TripReferenceSnapshot[]
): TripDataIntegrityReport => {
  const tripIdsWithoutCourses: string[] = [];
  const invalidDateTripIds: string[] = [];
  const duplicateCourseTripIds: string[] = [];
  const invalidLocationTripIds: string[] = [];
  const invalidDisplayRatingTripIds: string[] = [];
  const invalidSlopeTripIds: string[] = [];

  for (const trip of trips) {
    const tripId = asId(trip._id);
    const courses = trip.courses ?? [];

    if (courses.length === 0) tripIdsWithoutCourses.push(tripId);
    if (!isValidISODate(trip.date)) invalidDateTripIds.push(tripId);

    const seenCourseIdentities = new Set<string>();
    let hasDuplicateCourse = false;
    let invalidLocation = false;
    let invalidDisplayRating = false;
    let invalidSlope = false;

    for (const course of courses) {
      const identity = courseIdentity(course);
      if (identity) {
        if (seenCourseIdentities.has(identity)) hasDuplicateCourse = true;
        else seenCourseIdentities.add(identity);
      }

      invalidLocation ||= hasInvalidLocation(course);
      invalidDisplayRating ||= hasInvalidDisplayRating(course);
      invalidSlope ||= hasInvalidSlope(course);
    }

    if (hasDuplicateCourse) duplicateCourseTripIds.push(tripId);
    if (invalidLocation) invalidLocationTripIds.push(tripId);
    if (invalidDisplayRating) invalidDisplayRatingTripIds.push(tripId);
    if (invalidSlope) invalidSlopeTripIds.push(tripId);
  }

  const sorted = (values: string[]) => values.sort((left, right) => left.localeCompare(right));

  sorted(tripIdsWithoutCourses);
  sorted(invalidDateTripIds);
  sorted(duplicateCourseTripIds);
  sorted(invalidLocationTripIds);
  sorted(invalidDisplayRatingTripIds);
  sorted(invalidSlopeTripIds);

  return {
    trips: trips.length,
    tripsWithoutCourses: tripIdsWithoutCourses.length,
    invalidDateTrips: invalidDateTripIds.length,
    duplicateCourseTrips: duplicateCourseTripIds.length,
    invalidLocationTrips: invalidLocationTripIds.length,
    invalidDisplayRatingTrips: invalidDisplayRatingTripIds.length,
    invalidSlopeTrips: invalidSlopeTripIds.length,
    tripIdsWithoutCourses,
    invalidDateTripIds,
    duplicateCourseTripIds,
    invalidLocationTripIds,
    invalidDisplayRatingTripIds,
    invalidSlopeTripIds,
  };
};

export const analyzeTripPlayerIntegrity = (
  trips: TripReferenceSnapshot[]
): TripPlayerIntegrityReport => {
  const duplicatePlayerTripIds: string[] = [];
  const malformedScorecardTripIds: string[] = [];

  for (const trip of trips) {
    const tripId = asId(trip._id);
    const players = trip.players ?? [];
    const seenNames = new Set<string>();
    let duplicatePlayer = false;
    let malformedScorecard = false;

    for (const player of players) {
      const normalizedName = trimmed(player.name).toLowerCase();
      if (normalizedName) {
        if (seenNames.has(normalizedName)) duplicatePlayer = true;
        else seenNames.add(normalizedName);
      }

      malformedScorecard ||= hasMalformedScorecard(player);
    }

    if (duplicatePlayer) duplicatePlayerTripIds.push(tripId);
    if (malformedScorecard) malformedScorecardTripIds.push(tripId);
  }

  duplicatePlayerTripIds.sort((left, right) => left.localeCompare(right));
  malformedScorecardTripIds.sort((left, right) => left.localeCompare(right));

  return {
    trips: trips.length,
    duplicatePlayerTrips: duplicatePlayerTripIds.length,
    malformedScorecardTrips: malformedScorecardTripIds.length,
    duplicatePlayerTripIds,
    malformedScorecardTripIds,
  };
};
