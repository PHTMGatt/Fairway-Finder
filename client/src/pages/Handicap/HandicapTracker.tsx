// client/src/pages/Handicap/HandicapTracker.tsx
// Note; All pop-up alerts removed. Errors are now console-logged.

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import { UPDATE_PLAYER_HANDICAP } from '../../utils/mutations';
import {
  searchCourses,
  getCourseById,
  CourseSummary,
  TeeBox,
} from './HandicapAPI';
import Auth from '../../utils/auth';
import './HandicapTracker.css';

interface Trip {
  _id: string;
  name: string;
  courses: { name: string }[];
  players: { name: string }[];
}

const HandicapTracker: React.FC = () => {
  // Apollo: fetch current user's trips
  const { data, loading } = useQuery<{ me: { trips: Trip[] } }>(QUERY_MY_TRIPS);
  const [updatePlayerHandicap] = useMutation(UPDATE_PLAYER_HANDICAP);

  // Local component state
  const [tripId, setTripId] = useState('');
  const [player, setPlayer] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [teeColor, setTeeColor] = useState('');
  const [gross, setGross] = useState('');
  const [handicap, setHandicap] = useState<number | null>(null);

  // API search results + dynamic tee lists
  const [apiCourses, setApiCourses] = useState<CourseSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTees, setAvailableTees] = useState<string[]>([]);

  // 1) When the trips load, default to the first trip in the list
  useEffect(() => {
    if (!loading && data?.me.trips.length) {
      setTripId(data.me.trips[0]._id);
    }
  }, [loading, data]);

  // 2) When the selected trip changes:
  //    • Auto‐select first player (if none chosen yet)
  //    • Grab that trip’s “raw” course name, pick just the first two words
  //    • Populate searchQuery and immediately call handleCourseSearch()
  useEffect(() => {
    const trip = data?.me.trips.find((t) => t._id === tripId);
    if (!trip) return;

    // Auto‐select first player if not set
    if (trip.players.length && !player) {
      setPlayer(trip.players[0].name);
    }

    // Take the trip’s course name (e.g. “Chemung Hills Country Club”),
    // strip off anything after “&” (if present), then take only the first two words:
    const rawName = trip.courses[0]?.name || '';
    const splitAmpersand = rawName.split('&')[0].trim();
    const firstTwoWords = splitAmpersand.split(/\s+/).slice(0, 2).join(' ');
    setSearchQuery(firstTwoWords);

    // Immediately run a search for “Chemung Hills” (for example):
    handleCourseSearch(firstTwoWords);
  }, [tripId, data, player, handleCourseSearch]);

  /**
   * Normalize a search term & call the API. Once we get back at least one CourseSummary,
   * we fetch details for the FIRST match (to populate availableTees).
   */
  const handleCourseSearch = useCallback(
    async (manualQuery?: string) => {
      const raw = manualQuery !== undefined ? manualQuery : searchQuery;
      const cleaned = raw.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
      if (!cleaned) {
        console.warn('handleCourseSearch called with empty search term.');
        setApiCourses([]);
        setAvailableTees([]);
        setTeeColor('');
        return;
      }

      const results = await searchCourses(cleaned);
      console.log('🔍 searchCourses returned:', results);
      setApiCourses(results);

      if (results.length === 0) {
        console.warn('No API match found for:', cleaned);
        setAvailableTees([]);
        setTeeColor('');
        return;
      }

      // Fetch details for the **first** matching CourseSummary
      const firstId = results[0].id;
      try {
        const details = await getCourseById(String(firstId));
        if (!details) {
          console.warn('Could not fetch course details for ID:', firstId);
          setAvailableTees([]);
          setTeeColor('');
          return;
        }

        console.log('🏌️‍♂️ getCourseById returned (CourseDetails):', details);

        // Extract the list of tees for the chosen gender
        const teeList: TeeBox[] = details.tees[gender] || [];
        console.log(`👥 teeList for gender "${gender}":`, teeList);

        const names = teeList.map((t) => t.tee_name);
        setAvailableTees(names);

        // If no teeColor has been chosen yet, default to the first available
        if (names.length) {
          setTeeColor(names[0]);
        } else {
          setTeeColor('');
        }
      } catch (err) {
        console.error('Error during handleCourseSearch while fetching details:', err);
        setAvailableTees([]);
        setTeeColor('');
      }
    },
    [searchQuery, gender]
  );

  // Handicap calculation formula
  const calculateHandicap = (grossScore: number, rating: number, slope: number) =>
    Math.round(((grossScore - rating) * 113) / slope * 10) / 10;

  // Called when the user clicks “Save Round”
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const g = parseFloat(gross);
    if (!tripId || !player || isNaN(g) || apiCourses.length === 0) {
      console.warn('Missing required fields for saving round.');
      return;
    }

    try {
      let matchTee: TeeBox | null = null;

      // Loop over every CourseSummary returned from searchCourses
      // until we find a matching TeeBox that exactly equals teeColor
      for (const cs of apiCourses) {
        const details = await getCourseById(String(cs.id));
        if (!details) continue;
        const teeList: TeeBox[] = details.tees[gender] || [];
        matchTee =
          teeList.find((t) => t.tee_name.toLowerCase() === teeColor.toLowerCase()) ||
          null;
        if (matchTee) break;
      }

      if (!matchTee) {
        console.warn('Tee not found for color:', teeColor);
        return;
      }

      // Calculate and set the handicap
      const idx = calculateHandicap(g, matchTee.course_rating, matchTee.slope_rating);
      setHandicap(idx);

      // Send mutation to update the player’s handicap in the DB
      await updatePlayerHandicap({
        variables: { tripId, name: player, handicap: idx },
      });

      console.log(`✅ Saved handicap for ${player}: ${idx}`);
    } catch (err) {
      console.error('Error calculating handicap:', err);
    }

    // Clear the gross score input
    setGross('');
  };

  // If not logged in, show a message
  if (!Auth.loggedIn()) {
    return (
      <div className="handicap-container">
        <h1 className="title">Handicap Tracker</h1>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  // While trips are still loading, show a loading message
  if (loading) return <p>Loading trips…</p>;

  // Extract the currently selected trip, its players, and the raw course name
  const selectedTrip = data?.me.trips.find((t) => t._id === tripId);
  const players = selectedTrip?.players ?? [];
  const tripCourse = selectedTrip?.courses?.[0]?.name ?? '';

  return (
    <div className="handicap-container">
      <div className="setup-card">
        <h1 className="title">Handicap Tracker</h1>

        {/* Trip Selector */}
        <div className="form-group">
          <label>Select Trip</label>
          <select
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value);
              setPlayer('');
              setGross('');
              setHandicap(null);
              setApiCourses([]);
              setAvailableTees([]);
              setTeeColor('');
            }}
          >
            {data?.me.trips.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Player Selector */}
        <div className="form-group">
          <label>Select Player</label>
          <select value={player} onChange={(e) => setPlayer(e.target.value)}>
            {players.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Name + Search API Courses (same row) */}
        <div className="flex-row">
          <div className="form-group">
            <label>Trip Course</label>
            <input value={tripCourse} disabled />
          </div>

          <div className="form-group search-row">
            <label>Search API Courses</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCourseSearch();
              }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                className="search-input"
                type="text"
                placeholder="Search course name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="search-btn"
                onClick={() => handleCourseSearch()}
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Gender + Tee Color (same row) */}
        <div className="flex-row">
          <div className="form-group">
            <label>Gender</label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as 'male' | 'female');
                // Re-run search so that availableTees is refreshed for new gender
                if (searchQuery.trim()) {
                  handleCourseSearch();
                }
              }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tee Color</label>
            <select
              value={teeColor}
              onChange={(e) => setTeeColor(e.target.value)}
              disabled={availableTees.length === 0}
            >
              <option value="">-- Select Tee --</option>
              {availableTees.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gross Score + Save / Clear Buttons */}
        <form className="round-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Gross Score</label>
            <input
              type="number"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              required
            />
          </div>

          <div className="button-wrapper">
            <button type="submit" className="submit-btn">
              Save Round
            </button>
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setGross('');
                setHandicap(null);
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {/* Handicap Output */}
        <div className="handicap-info">
          <h2>Your Handicap Index</h2>
          <p className="handicap-value">
            {handicap !== null ? handicap.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandicapTracker;
