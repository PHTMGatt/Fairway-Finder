// client/src/pages/Handicap/HandicapAPI.ts

/**
 * Handicap calculations use live GolfCourseAPI rating/slope data through the
 * server-side Express proxy. Keeping the provider call behind `/api/golf`
 * avoids exposing the provider API key to the browser.
 */
const API_BASE = '/api/golf';

/** ─────────────────────────────────────────────────────────────────────────────
 *  Interfaces (these must match the structure of the API)
 *  ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Minimal “summary” returned by search—just enough to identify the course to fetch details later.
 */
export interface CourseSummary {
  id: number;
  club_name: string;
  course_name: string;
  location?: { address?: string };
}

/**
 * Each TeeBox entry (we only care about `course_rating` and `slope_rating` for handicap calculation).
 */
export interface TeeBox {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  // (other fields like bogey_rating, holes[], etc. are optional/ignored)
}

/**
 * Full course details returned by GET /v1/courses/{id} through our proxy.
 */
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

/** ─────────────────────────────────────────────────────────────────────────────
 *  searchCourses(query: string) → Promise<CourseSummary[]>
 *  ─────────────────────────────────────────────────────────────────────────────
 */
export async function searchCourses(
  query: string
): Promise<CourseSummary[]> {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) {
    console.warn('searchCourses(): empty query → returning []');
    return [];
  }

  const url = `${API_BASE}/search?search_query=${encodeURIComponent(cleaned)}`;
  console.log('📤 [API] Hitting Golf Proxy (search):', url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Search failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    const courses: CourseSummary[] = Array.isArray(data.courses) ? data.courses : [];
    console.log('✅ [API] searchCourses returned:', courses);
    return courses;
  } catch (err) {
    console.error('❌ [API] searchCourses error:', err);
    return [];
  }
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  getCourseById(id: string) → Promise<CourseDetails | null>
 *  ─────────────────────────────────────────────────────────────────────────────
 */
export async function getCourseById(
  id: string
): Promise<CourseDetails | null> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    console.warn('getCourseById(): empty id → returning null');
    return null;
  }

  const url = `${API_BASE}/${encodeURIComponent(trimmedId)}`;
  console.log('📤 [API] Hitting Golf Proxy (details):', url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Details fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    const course = normalizeCourseDetailsResponse(json);
    if (!course) {
      console.error('❌ [API] getCourseById returned an invalid course payload:', json);
      return null;
    }
    console.log('✅ [API] Course details fetched:', course);
    return course;
  } catch (err) {
    console.error('❌ [API] getCourseById error:', err);
    return null;
  }
}
