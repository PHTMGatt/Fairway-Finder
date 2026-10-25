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

const usableAddress = (address: string) => {
  const trimmed = address.trim();
  return trimmed && trimmed !== 'Address N/A' ? trimmed : undefined;
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
