export interface PersistedTripCourse {
  name?: string | null;
  source?: string | null;
  providerId?: string | null;
  golfCourseApiId?: string | null;
  courseRating?: number | null;
  slope?: number | null;
}

export type GolfCourseLookup =
  | { kind: 'details'; id: string }
  | { kind: 'search'; query: string }
  | null;

export interface TeeRating {
  courseRating: number;
  slopeRating: number;
}

const trimmed = (value?: string | null) => value?.trim() || '';

export const resolveGolfCourseLookup = (
  course?: PersistedTripCourse | null
): GolfCourseLookup => {
  if (!course) return null;

  const explicitId = trimmed(course.golfCourseApiId);
  if (explicitId) return { kind: 'details', id: explicitId };

  if (course.source === 'golfcourseapi') {
    const providerId = trimmed(course.providerId);
    if (providerId) return { kind: 'details', id: providerId };
  }

  // Canonical provider-backed courses must not be silently re-identified by a
  // fuzzy cross-provider name search. Name lookup remains only for old trips
  // that predate provider identity storage.
  if (trimmed(course.source) || trimmed(course.providerId)) return null;

  const name = trimmed(course.name);
  return name ? { kind: 'search', query: name } : null;
};

export const storedTeeRating = (
  course?: PersistedTripCourse | null
): TeeRating | null =>
  typeof course?.courseRating === 'number' && typeof course?.slope === 'number'
    ? { courseRating: course.courseRating, slopeRating: course.slope }
    : null;
