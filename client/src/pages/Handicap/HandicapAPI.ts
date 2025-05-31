// client/src/pages/Handicap/HandicapAPI.ts

const API_BASE = 'https://golf-course-api.vercel.app/v1';
const API_KEY = import.meta.env.VITE_GOLF_API_KEY;

const headers = {
  Authorization: `Key ${API_KEY}`,
};

/**
 * Note; Searches for courses by name using the external Golf Course API.
 * @param query - Partial or full course name
 * @returns Array of matching course objects (if any)
 */
export const searchCourses = async (query: string) => {
  try {
    const res = await fetch(`${API_BASE}/courses/search?name=${encodeURIComponent(query)}`, {
      headers,
    });

    if (!res.ok) {
      console.error(`Search failed: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    return data.courses || [];
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
};

/**
 * Note; Fetches full course details by ID, including tee information.
 * @param id - Course ID from previous search
 * @returns Course object with full tee data or null
 */
export const getCourseById = async (id: string) => {
  try {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      headers,
    });

    if (!res.ok) {
      console.error(`Details fetch failed: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Details fetch error:', err);
    return null;
  }
};
