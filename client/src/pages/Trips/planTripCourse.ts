export interface CourseSearchResult {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
  location: { lat: number; lng: number } | null;
}

export interface TripCourseInput {
  name: string;
  source?: 'google' | 'golfcourseapi' | 'osm';
  providerId?: string;
  address?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  golfCourseApiId?: string;
}

export interface PlanTripPrefill {
  city: string;
  course: CourseSearchResult | null;
}

const usableAddress = (address: string) => {
  const trimmed = address.trim();
  return trimmed && trimmed !== 'Address N/A' ? trimmed : undefined;
};

const isFiniteLocation = (
  value: unknown
): value is { lat: number; lng: number } => {
  if (!value || typeof value !== 'object') return false;
  const location = value as { lat?: unknown; lng?: unknown };
  return (
    typeof location.lat === 'number' &&
    Number.isFinite(location.lat) &&
    typeof location.lng === 'number' &&
    Number.isFinite(location.lng)
  );
};

const isCourseSearchResult = (value: unknown): value is CourseSearchResult => {
  if (!value || typeof value !== 'object') return false;
  const course = value as Partial<CourseSearchResult>;

  return (
    typeof course.name === 'string' &&
    Boolean(course.name.trim()) &&
    typeof course.address === 'string' &&
    typeof course.place_id === 'string' &&
    Boolean(course.place_id.trim()) &&
    (course.rating === null || typeof course.rating === 'number') &&
    (course.location === null || isFiniteLocation(course.location))
  );
};

export const readPlanTripPrefill = (state: unknown): PlanTripPrefill => {
  if (!state || typeof state !== 'object') {
    return { city: '', course: null };
  }

  const candidate = state as { city?: unknown; course?: unknown };
  const city = typeof candidate.city === 'string' ? candidate.city.trim() : '';
  const course = isCourseSearchResult(candidate.course) ? candidate.course : null;

  return { city, course };
};

export const toTripCourseInput = (course: CourseSearchResult): TripCourseInput => {
  const result: TripCourseInput = { name: course.name.trim() };
  const address = usableAddress(course.address);

  if (course.place_id.startsWith('golfcourseapi-')) {
    const providerId = course.place_id.slice('golfcourseapi-'.length).trim();
    if (providerId) {
      result.source = 'golfcourseapi';
      result.providerId = providerId;
      result.golfCourseApiId = providerId;
    }
  } else if (course.place_id.startsWith('osm-')) {
    result.source = 'osm';
    result.providerId = course.place_id;
  } else if (course.place_id.trim()) {
    result.source = 'google';
    result.providerId = course.place_id.trim();
  }

  if (address) result.address = address;
  if (course.location) result.location = course.location;
  if (typeof course.rating === 'number') result.rating = course.rating;

  return result;
};
