// client/src/pages/Handicap/HandicapAPI.ts

/**
 * Handicap calculations use live GolfCourseAPI rating/slope data through the
 * server-side Express proxy. Keeping the provider call behind `/api/golf`
 * avoids exposing the provider API key to the browser.
 */
const API_BASE = '/api/golf';

export interface CourseSummary {
  id: number | string;
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
  id: number | string;
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

// GolfCourseAPI ids are short strings (e.g. "86gj0vqf"); older payloads used numbers.
// Some courses have no tee list for one or both genders, so missing arrays become [].
const toCourseDetails = (value: unknown): CourseDetails | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<CourseDetails>;
  const idOk = typeof candidate.id === 'number' || (typeof candidate.id === 'string' && candidate.id !== '');
  if (
    !idOk ||
    typeof candidate.club_name !== 'string' ||
    typeof candidate.course_name !== 'string' ||
    !candidate.location ||
    typeof candidate.location !== 'object'
  ) {
    return null;
  }
  const tees = (candidate.tees && typeof candidate.tees === 'object' ? candidate.tees : {}) as Partial<CourseDetails['tees']>;
  return {
    ...(candidate as CourseDetails),
    tees: {
      male: Array.isArray(tees.male) ? tees.male : [],
      female: Array.isArray(tees.female) ? tees.female : [],
    },
  };
};

/**
 * The Fairway Finder proxy passes GolfCourseAPI's detail payload through directly.
 * Keep accepting the old wrapped shape as a compatibility fallback for stale callers/tests.
 */
export const normalizeCourseDetailsResponse = (value: unknown): CourseDetails | null => {
  const direct = toCourseDetails(value);
  if (direct) return direct;
  if (!value || typeof value !== 'object') return null;
  return toCourseDetails((value as { course?: unknown }).course);
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
