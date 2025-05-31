import React, { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import { UPDATE_PLAYER_HANDICAP } from '../../utils/mutations';
import { searchCourses, getCourseById } from './HandicapAPI';
import Auth from '../../utils/auth';
import './HandicapTracker.css';

// ==== Types ====
interface Trip {
  _id: string;
  name: string;
  courses: { name: string }[];
  players: { name: string }[];
}

const HandicapTracker: React.FC = () => {
  // ==== 🔐 Lock Page If Not Logged In ====
  if (!Auth.loggedIn()) {
    return (
      <div className="handicap-container">
        <h1 className="title">Handicap Tracker</h1>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  // ==== Apollo ====
  const { data, loading } = useQuery<{ me: { trips: Trip[] } }>(QUERY_MY_TRIPS);
  const [updatePlayerHandicap] = useMutation(UPDATE_PLAYER_HANDICAP);

  // ==== State ====
  const [tripId, setTripId] = useState('');
  const [player, setPlayer] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [teeColor, setTeeColor] = useState('Blue');
  const [gross, setGross] = useState('');
  const [handicap, setHandicap] = useState<number | null>(null);

  // ==== On Mount: Set default trip ====
  useEffect(() => {
    if (!loading && data?.me.trips.length) {
      setTripId(data.me.trips[0]._id);
    }
  }, [loading, data]);

  // ==== On Trip Change: Set default player ====
  useEffect(() => {
    const trip = data?.me.trips.find((t) => t._id === tripId);
    if (trip?.players.length && !player) {
      setPlayer(trip.players[0].name);
    }
  }, [tripId, data, player]);

  // ==== Handicap Formula ====
  const calculateHandicap = (gross: number, rating: number, slope: number) =>
    Math.round(((gross - rating) * 113 / slope) * 10) / 10;

  // ==== Fetch Rating & Slope From API ====
  const fetchSlopeAndRating = async () => {
    const trip = data?.me.trips.find((t) => t._id === tripId);
    const courseName = trip?.courses?.[0]?.name;
    if (!courseName) throw new Error('Course name missing');

    const matches = await searchCourses(courseName);
    const bestMatch = matches?.[0];
    if (!bestMatch) throw new Error('Course not found in GolfCourseAPI');

    const details = await getCourseById(bestMatch.id);
    const match = details.tees?.[gender]?.find(
      (t: any) => t.tee_name.toLowerCase() === teeColor.toLowerCase()
    );

    if (!match) throw new Error('Tee not found for selection');

    return {
      rating: match.course_rating,
      slope: match.slope_rating,
    };
  };

  // ==== Submit Round ====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const g = parseFloat(gross);
    if (!tripId || !player || isNaN(g)) return;

    try {
      const { rating, slope } = await fetchSlopeAndRating();
      const idx = calculateHandicap(g, rating, slope);
      setHandicap(idx);
      await updatePlayerHandicap({ variables: { tripId, name: player, handicap: idx } });
    } catch (err) {
      console.error('Error calculating handicap:', err);
    }

    setGross('');
  };

  if (loading) return <p>Loading trips…</p>;
  const selectedTrip = data?.me.trips.find((t) => t._id === tripId);
  const players = selectedTrip?.players ?? [];

  // ==== UI ====
  return (
    <div className="handicap-container">
      <div className="setup-card">
        <h1 className="title">Handicap Tracker</h1>

        {/* Select Trip */}
        <div className="form-group">
          <label>Select Trip</label>
          <select
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value);
              setPlayer('');
              setGross('');
              setHandicap(null);
            }}
          >
            {data?.me.trips.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Player */}
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

        {/* Gender & Tee Color */}
        <div className="form-row">
          <div className="form-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tee Color</label>
            <select value={teeColor} onChange={(e) => setTeeColor(e.target.value)}>
              <option value="Blue">Blue</option>
              <option value="White">White</option>
              <option value="Red">Red</option>
              <option value="Gold">Gold</option>
            </select>
          </div>
        </div>

        {/* Gross Score Form */}
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

        {/* Handicap Result */}
        <div className="handicap-info">
          <h2>Your Handicap Index</h2>
          <p className="handicap-value">{handicap !== null ? handicap.toFixed(1) : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default HandicapTracker;
