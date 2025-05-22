// src/utils/courseApi.ts

export interface Course {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  rating: number | null;
  place_id: string;
}

interface FetchCoursesOptions {
  city: string;
  limit?: number;
}

// Fetch courses for a given city (and optional limit) from backend API
export const fetchCoursesByCity = async ({
  city,
  limit,
}: FetchCoursesOptions): Promise<Course[]> => {
  if (!city.trim()) {
    throw new Error('City is required');
  }

  const params = new URLSearchParams({ city });
  if (limit && !isNaN(limit) && limit > 0) {
    params.set('limit', String(limit));
  }

  const res = await fetch(`/api/courses?${params.toString()}`);
  if (!res.ok) {
    // Attempt to parse error message from body
    let errMsg = 'Failed to fetch courses';
    try {
      const errBody = await res.json();
      if (errBody.error) errMsg = errBody.error;
    } catch {
      /* ignore JSON parse errors */
    }
    throw new Error(errMsg);
  }

  const data = (await res.json()) as Course[];
  return data;
};
