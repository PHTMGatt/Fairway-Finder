// client/src/pages/Trips/useTeeRating.ts
// Course rating + slope for the trip course: stored values first, then the golf course API.
import { useCallback, useEffect, useState } from 'react';
import {
  PersistedTripCourse,
  TeeRating,
  resolveGolfCourseLookup,
  storedTeeRating,
} from './tripDetailsCourse';

interface Tee {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
}

interface GolfCourseAPIResponse {
  tees: { male: Tee[]; female: Tee[] };
}

export const useTeeRating = (course?: PersistedTripCourse | null) => {
  const [teeRating, setTeeRating] = useState<TeeRating | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (selectedCourse: PersistedTripCourse) => {
    const persisted = storedTeeRating(selectedCourse);
    if (persisted) {
      setTeeRating(persisted);
      setError('');
      return;
    }

    const lookup = resolveGolfCourseLookup(selectedCourse);
    if (!lookup) {
      setTeeRating(null);
      setError('');
      return;
    }

    try {
      setError('');
      let courseId: string;

      if (lookup.kind === 'details') {
        courseId = lookup.id;
      } else {
        const search = await fetch(
          `/api/golf/search?search_query=${encodeURIComponent(lookup.query)}`
        );
        if (!search.ok) throw new Error('Unable to search golf course details');

        const searchJson = await search.json();
        const firstResult = searchJson.courses?.[0];
        if (!firstResult?.id) {
          setTeeRating(null);
          return;
        }
        courseId = String(firstResult.id);
      }

      const details = await fetch(`/api/golf/${encodeURIComponent(courseId)}`);
      if (!details.ok) throw new Error('Unable to load golf course details');

      const fullData: GolfCourseAPIResponse = await details.json();
      const firstTee = fullData.tees.male?.[0];
      if (!firstTee) throw new Error('No tee data found');

      setTeeRating({ slopeRating: firstTee.slope_rating, courseRating: firstTee.course_rating });
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Error loading slope/rating');
      setTeeRating(null);
    }
  }, []);

  useEffect(() => {
    if (course) void load(course);
    else setTeeRating(null);
  }, [course, load]);

  return { teeRating, error };
};
