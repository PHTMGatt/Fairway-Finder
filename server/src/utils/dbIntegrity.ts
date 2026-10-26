interface IdLike {
  toString(): string;
}

interface ProfileReferenceSnapshot {
  _id: IdLike | string;
  trips?: Array<IdLike | string>;
}

interface TripReferenceSnapshot {
  _id: IdLike | string;
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

export interface DanglingReferenceCleanupPreview {
  affectedProfiles: number;
  danglingReferences: number;
  pulls: Array<{
    profileId: string;
    tripIds: string[];
  }>;
}

const asId = (value: IdLike | string): string => value.toString();

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

export const buildDanglingReferenceCleanupPreview = (
  report: TripReferenceIntegrityReport
): DanglingReferenceCleanupPreview => {
  const tripIdsByProfile = new Map<string, string[]>();

  for (const reference of report.dangling) {
    const tripIds = tripIdsByProfile.get(reference.profileId) ?? [];
    if (!tripIds.includes(reference.tripId)) tripIds.push(reference.tripId);
    tripIdsByProfile.set(reference.profileId, tripIds);
  }

  const pulls = Array.from(tripIdsByProfile.entries())
    .map(([profileId, tripIds]) => ({
      profileId,
      tripIds: [...tripIds].sort(),
    }))
    .sort((left, right) => left.profileId.localeCompare(right.profileId));

  return {
    affectedProfiles: pulls.length,
    danglingReferences: report.dangling.length,
    pulls,
  };
};
