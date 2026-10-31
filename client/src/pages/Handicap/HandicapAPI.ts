// client/src/pages/Handicap/HandicapAPI.ts

/**
 * Handicap calculations use live GolfCourseAPI rating/slope data through the
 * server-side Express proxy. Keeping the provider call behind `/api/golf`
 * avoids exposing the provider API key to the browser.
 */
const API_BASE = '/api/golf';

export interface CourseSummary {
  id: number;
  club_name: string;
  course_name: string;
  location?: { address?: string };
}

export interface TeeBox {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
}

export interface CourseDetails {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tees: {
    male: TeeBox[];
    female: TeeBox[];
  };
}

const isCourseDetails = (value: unknown): value is CourseDetails => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CourseDetails>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.club_name === 'string' &&
    typeof candidate.course_name === 'string' &&
    Boolean(candidate.location && typeof candidate.location === 'object') &&
    Boolean(candidate.tees && typeof candidate.tees === 'object') &&
    Array.isArray(candidate.tees?.male) &&
    Array.isArray(candidate.tees?.female)
  );
};

/**
 * The Fairway Finder proxy passes GolfCourseAPI's detail payload through directly.
 * Keep accepting the old wrapped shape as a compatibility fallback for stale callers/tests.
 */
export const normalizeCourseDetailsResponse = (value: unknown): CourseDetails | null => {
  if (isCourseDetails(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const wrapped = (value as { course?: unknown }).course;
  return isCourseDetails(wrapped) ? wrapped : null;
};

/**
 * Search failures deliberately reject instead of being converted to an empty result.
 * Callers can therefore distinguish a real "no courses found" response from a provider,
 * network, or proxy failure and present an honest error state to the user.
 */
export async function searchCourses(query: string): Promise<CourseSummary[]> {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return [];

  const url = `${API_BASE}/search?search_query=${encodeURIComponent(cleaned)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Course search failed (${res.status}): ${text}`);
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Course search returned an invalid response.');
  }

  const courses = (data as { courses?: unknown }).courses;
  if (courses === undefined) return [];
  if (!Array.isArray(courses)) {
    throw new Error('Course search returned an invalid courses payload.');
  }

  return courses as CourseSummary[];
}

/**
 * Course-detail failures reject so callers never have to treat provider/network failures
 * as a missing course. An empty id is also invalid input and rejects before any request.
 */
export async function getCourseById(id: string): Promise<CourseDetails> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error('Course id is required.');
  }

  const url = `${API_BASE}/${encodeURIComponent(trimmedId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Course details failed (${res.status}): ${text}`);
  }

  const json: unknown = await res.json();
  const course = normalizeCourseDetailsResponse(json);
  if (!course) {
    throw new Error('Course details returned an invalid payload.');
  }

  return course;
}
