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

type Gender = 'male' | 'female';
type Feedback = { kind: 'error' | 'success' | 'info'; message: string } | null;

const HandicapTracker: React.FC = () => {
  const { data, loading } = useQuery<{ me: { trips: Trip[] } }>(QUERY_MY_TRIPS);
  const [updatePlayerHandicap] = useMutation(UPDATE_PLAYER_HANDICAP);

  const [tripId, setTripId] = useState('');
  const [player, setPlayer] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [teeColor, setTeeColor] = useState('');
  const [gross, setGross] = useState('');
  const [handicap, setHandicap] = useState<number | null>(null);
  const [apiCourses, setApiCourses] = useState<CourseSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTees, setAvailableTees] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCourseSearch = useCallback(
    async (manualQuery?: string, requestedGender: Gender = gender) => {
      const raw = manualQuery !== undefined ? manualQuery : searchQuery;
      const cleaned = raw.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
      if (!cleaned) {
        setApiCourses([]);
        setAvailableTees([]);
        setTeeColor('');
        setFeedback({ kind: 'info', message: 'Enter a course name to search for tee information.' });
        return;
      }

      setSearching(true);
      setFeedback(null);
      try {
        const results = await searchCourses(cleaned);
        setApiCourses(results);

        if (results.length === 0) {
          setAvailableTees([]);
          setTeeColor('');
          setFeedback({ kind: 'info', message: 'No matching courses were found. Try a broader course name.' });
          return;
        }

        const firstId = results[0].id;
        const details = await getCourseById(String(firstId));
        const teeList: TeeBox[] = details.tees[requestedGender] || [];
        const names = teeList.map((t) => t.tee_name);
        setAvailableTees(names);
        setTeeColor(names[0] || '');
        if (names.length === 0) {
          setFeedback({ kind: 'info', message: `No ${requestedGender} tee data is available for this course.` });
        }
      } catch (err) {
        console.error('Error during handleCourseSearch:', err);
        setApiCourses([]);
        setAvailableTees([]);
        setTeeColor('');
        setFeedback({
          kind: 'error',
          message: 'Course data is unavailable right now. Please try the search again in a moment.',
        });
      } finally {
        setSearching(false);
      }
    },
    [searchQuery, gender]
  );

  useEffect(() => {
    if (!loading && data?.me.trips.length) {
      setTripId(data.me.trips[0]._id);
    }
  }, [loading, data]);

  useEffect(() => {
    const trip = data?.me.trips.find((t) => t._id === tripId);
    if (!trip) return;

    if (trip.players.length && !player) {
      setPlayer(trip.players[0].name);
    }

    const rawName = trip.courses[0]?.name || '';
    const splitAmpersand = rawName.split('&')[0].trim();
    const firstTwoWords = splitAmpersand.split(/\s+/).slice(0, 2).join(' ');
    setSearchQuery(firstTwoWords);
    handleCourseSearch(firstTwoWords);
  }, [tripId, data, player, handleCourseSearch]);

  const calculateHandicap = (grossScore: number, rating: number, slope: number) =>
    Math.round(((grossScore - rating) * 113) / slope * 10) / 10;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const g = parseFloat(gross);
    if (!tripId || !player || isNaN(g) || apiCourses.length === 0 || !teeColor) {
      setFeedback({
        kind: 'error',
        message: 'Choose a trip, player, course tee, and valid gross score before saving.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      let matchTee: TeeBox | null = null;

      for (const cs of apiCourses) {
        const details = await getCourseById(String(cs.id));
        const teeList: TeeBox[] = details.tees[gender] || [];
        matchTee =
          teeList.find((t) => t.tee_name.toLowerCase() === teeColor.toLowerCase()) ||
          null;
        if (matchTee) break;
      }

      if (!matchTee) {
        setFeedback({
          kind: 'error',
          message: 'That tee could not be matched to current course data. Search again and reselect a tee.',
        });
        return;
      }

      const idx = calculateHandicap(g, matchTee.course_rating, matchTee.slope_rating);
      await updatePlayerHandicap({
        variables: { tripId, name: player, handicap: idx },
      });
      setHandicap(idx);
      setGross('');
      setFeedback({ kind: 'success', message: `Saved ${player}'s handicap index at ${idx.toFixed(1)}.` });
    } catch (err) {
      console.error('Error calculating handicap:', err);
      setFeedback({
        kind: 'error',
        message: 'The handicap could not be calculated or saved. Your existing player data was not changed.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!Auth.loggedIn()) {
    return (
      <div className="handicap-page">
        <div className="auth-card">
          <h1 className="title">Handicap Tracker</h1>
          <p className="handicap-message">You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="handicap-page">
        <div className="auth-card">
          <h1 className="title">Handicap Tracker</h1>
          <p className="handicap-message">Loading your trips…</p>
        </div>
      </div>
    );
  }

  const selectedTrip = data?.me.trips.find((t) => t._id === tripId);
  const players = selectedTrip?.players ?? [];
  const tripCourse = selectedTrip?.courses?.[0]?.name ?? '';

  return (
    <div className="handicap-page">
      <div className="setup-card">
        <h1 className="title">Handicap Tracker</h1>

        {feedback && (
          <p
            className={`handicap-feedback handicap-feedback--${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {feedback.message}
          </p>
        )}

        <div className="form-group">
          <label className="form-label">Select Trip</label>
          <select
            className="form-select"
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value);
              setPlayer('');
              setGross('');
              setHandicap(null);
              setApiCourses([]);
              setAvailableTees([]);
              setTeeColor('');
              setFeedback(null);
            }}
          >
            {data?.me.trips.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Select Player</label>
          <select
            className="form-select"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
          >
            {players.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-row">
          <div className="form-group">
            <label className="form-label">Trip Course</label>
            <input className="form-input" value={tripCourse} disabled />
          </div>

          <div className="form-group search-row">
            <label className="form-label">Search API Courses</label>
            <div className="search-controls">
              <input
                className="search-input"
                type="text"
                placeholder="Course name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="search-btn"
                onClick={() => handleCourseSearch()}
                disabled={searching}
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-row">
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-select"
              value={gender}
              onChange={(e) => {
                const nextGender = e.target.value as Gender;
                setGender(nextGender);
                if (searchQuery.trim()) {
                  handleCourseSearch(undefined, nextGender);
                }
              }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tee Color</label>
            <select
              className="form-select"
              value={teeColor}
              onChange={(e) => setTeeColor(e.target.value)}
              disabled={availableTees.length === 0 || searching}
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

        <form className="round-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Gross Score</label>
            <input
              className="form-input"
              type="number"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              required
            />
          </div>

          <div className="button-wrapper">
            <button type="submit" className="submit-btn" disabled={saving || searching}>
              {saving ? 'Saving…' : 'Save Round'}
            </button>
            <button
              type="button"
              className="clear-btn"
              disabled={saving}
              onClick={() => {
                setGross('');
                setHandicap(null);
                setFeedback(null);
              }}
            >
              Clear
            </button>
          </div>
        </form>

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
