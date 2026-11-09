// client/src/pages/Courses/useStartRound.ts
// "Pick the place and it does the rest": one tap on a course creates today's
// round (starting a private 24-hour guest session first if nobody is signed in)
// and opens the scorecard. Each guest is its own isolated account, so two people
// starting rounds never see each other's data.
import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import Auth from '../../utils/auth';
import { ADD_TRIP, START_GUEST_SESSION } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import { useAuth } from '../Auth/AuthContext';
import { extractGuestToken } from '../../components/GuestDemoButton.utils';
import { CourseSearchResult, toTripCourseInput } from '../Trips/planTripCourse';

/** Local calendar date as YYYY-MM-DD (not UTC, so an evening round isn't "tomorrow"). */
export const todayIso = (now = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Trip names are capped at 80 characters server-side. */
export const roundName = (courseName: string): string => {
  const name = courseName.trim() || 'Golf round';
  return name.length > 80 ? `${name.slice(0, 79)}…` : name;
};

export const useStartRound = () => {
  const { isLoggedIn, refreshAuth } = useAuth();
  const client = useApolloClient();
  const navigate = useNavigate();
  const [startGuestSession] = useMutation(START_GUEST_SESSION);
  const [addTrip] = useMutation(ADD_TRIP);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRound = async (course: CourseSearchResult) => {
    setError(null);
    setStartingId(course.place_id || course.name);
    try {
      if (!isLoggedIn) {
        const { data } = await startGuestSession();
        const token = extractGuestToken(data);
        if (!token) throw new Error('Could not start a guest session.');
        Auth.login(token);
        refreshAuth();
        await client.clearStore();
      }
      const { data } = await addTrip({
        variables: {
          input: { name: roundName(course.name), date: todayIso(), course: toTripCourseInput(course) },
        },
        refetchQueries: [{ query: QUERY_MY_TRIPS }],
      });
      const id = data?.addTrip?._id;
      if (!id) throw new Error('Could not start the round.');
      navigate(`/trip/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Could not start the round. Try again.');
    } finally {
      setStartingId(null);
    }
  };

  return { startRound, startingId, error };
};
