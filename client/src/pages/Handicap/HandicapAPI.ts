// client/src/pages/Handicap/HandicapAPI.ts

/**
 * ─── TOGGLE HERE ───
 * Set USE_API = true  → live GolfCourseAPI via your Express proxy (/api/golf)
 * Set USE_API = false → local in-memory data (LocalHandicapData.ts)
 */
const USE_API = false;

const API_BASE = '/api/golf'; // your Express proxy mount point

// If USE_API = false, we'll import a hard-coded array of courses:
import { localCourses } from './LocalHandicapData';

/** ─────────────────────────────────────────────────────────────────────────────
 *  Interfaces (these must match the structure of your API OR your Local data)
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
 * Full course details (returned by GET /v1/courses/{id} or from our `localCourses` array).
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

  if (!USE_API) {
    // ─── LOCAL MODE ───
    // Filter localCourses by substring match on course_name or club_name
    const matches: CourseSummary[] = localCourses
      .filter((c) => {
        const full = (c.course_name || c.club_name).toLowerCase();
        return full.includes(cleaned);
      })
      .map((c) => ({
        id: c.id,
        club_name: c.club_name,
        course_name: c.course_name,
        location: { address: c.location.address },
      }));

    console.log('🔍 [Local] searchCourses returned:', matches);
    return matches;
  }

  // ─── API MODE ───
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

  if (!USE_API) {
    // ─── LOCAL MODE ───
    const numericId = parseInt(trimmedId, 10);
    const found = localCourses.find((c) => c.id === numericId) || null;
    console.log('📥 [Local] getCourseById returned:', found);
    return found;
  }

  // ─── API MODE ───
  const url = `${API_BASE}/${encodeURIComponent(trimmedId)}`;
  console.log('📤 [API] Hitting Golf Proxy (details):', url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Details fetch failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    // Proxy returns { course: CourseDetails }
    if (!json.course) {
      console.error('❌ [API] getCourseById missing "course" field:', json);
      return null;
    }
    console.log('✅ [API] Course details fetched:', json.course);
    return json.course as CourseDetails;
  } catch (err) {
    console.error('❌ [API] getCourseById error:', err);
    return null;
  }
}
