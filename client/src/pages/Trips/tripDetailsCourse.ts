export interface PersistedTripCourse {
  name?: string | null;
  source?: string | null;
  providerId?: string | null;
  golfCourseApiId?: string | null;
  courseRating?: number | null;
  slope?: number | null;
  location?: { lat: number; lng: number } | null;
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
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const secondaryTripCourses = <T>(courses: T[]): T[] => courses.slice(1);

export const courseRemovalPrompt = (courseName: string): string =>
  `Remove ${courseName} from this trip? This will not delete the trip.`;

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

export const weatherParamsForCourse = (
  course?: PersistedTripCourse | null,
  tripDate?: string | null
): URLSearchParams | null => {
  if (
    typeof course?.location?.lat !== 'number' ||
    typeof course.location.lng !== 'number'
  ) {
    return null;
  }

  const params = new URLSearchParams({
    lat: String(course.location.lat),
    lng: String(course.location.lng),
  });
  const name = trimmed(course.name);
  if (name) params.set('name', name);
  const date = trimmed(tripDate);
  if (ISO_DATE.test(date)) params.set('date', date);
  return params;
};
