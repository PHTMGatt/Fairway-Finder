// client/src/pages/Handicap/HandicapTracker.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Round,
  getRounds,
  saveRound,
  clearRounds,
  calculateHandicapIndex,
} from './HandicapLogic';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import { UPDATE_HANDICAP } from '../../utils/mutations';
import './HandicapTracker.css';

interface TripOption {
  _id: string;
  name: string;
}

const HandicapTracker: React.FC = () => {
  // Note; Query all trips for current user
  const { data, loading } = useQuery<{ me: { trips: TripOption[] } }>(
    QUERY_MY_TRIPS
  );

  // Note; Mutation to update trip's handicap index
  const [updateHandicap] = useMutation(UPDATE_HANDICAP, {
    update(cache, { data }) {
      if (!data?.updateTripHandicap) return;
      const updated = data.updateTripHandicap;
      cache.modify({
        id: cache.identify({ __typename: 'Trip', _id: updated._id }),
        fields: {
          handicap() {
            return updated.handicap;
          },
        },
      });
    },
  });

  // Note; State hooks
  const [tripId, setTripId] = useState<string>('');
  const [gross, setGross] = useState<string>('');
  const [rating, setRating] = useState<string>('');
  const [slope, setSlope] = useState<string>('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [handicap, setHandicap] = useState<number | null>(null);

  // Note; Initialize with first trip
  useEffect(() => {
    if (!loading && data?.me.trips.length) {
      setTripId(data.me.trips[0]._id);
    }
  }, [loading, data]);

  // Note; Load rounds and index when trip changes
  useEffect(() => {
    if (!tripId) {
      setRounds([]);
      setHandicap(null);
      return;
    }
    const saved = getRounds(tripId);
    setRounds(saved);
    setHandicap(calculateHandicapIndex(saved));
  }, [tripId]);

  // Note; Handle new round submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const g = parseFloat(gross),
      r = parseFloat(rating),
      s = parseInt(slope, 10);
    if (!tripId || isNaN(g) || isNaN(r) || isNaN(s) || s <= 0) return;

    const newRound: Round = {
      adjustedGrossScore: g,
      slopeRating: s,
      courseRating: r,
    };

    saveRound(tripId, newRound);
    const updated = getRounds(tripId);
    setRounds(updated);

    const idx = calculateHandicapIndex(updated);
    setHandicap(idx);

    if (idx !== null) {
      updateHandicap({ variables: { tripId, handicap: idx } }).catch(console.error);
    }

    setGross('');
  };

  // Note; Clear all rounds for current trip
  const handleClear = () => {
    if (!tripId) return;
    clearRounds(tripId);
    setRounds([]);
    setHandicap(null);
  };

  if (loading) return <p>Loading trips…</p>;

  return (
    <div className="handicap-container">
      <div className="setup-card">
        <h1 className="title">Handicap Tracker</h1>

        {/* Note; Trip Selector */}
        <div className="form-group">
          <label>Select Trip</label>
          <select
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value);
              setGross('');
              setRating('');
              setSlope('');
            }}
          >
            {data?.me.trips.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Note; Score Entry Form */}
        <form className="round-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Rating™</label>
            <input
              name="rating"
              type="number"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Slope Rating®</label>
            <input
              name="slope"
              type="number"
              value={slope}
              onChange={(e) => setSlope(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Gross Score</label>
            <input
              name="gross"
              type="number"
              min="1"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              required
            />
          </div>
          <div className="form-group lookup">
            <label>&nbsp;</label>
            <a
              href="https://ncrdb.usga.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lookup on USGA.com →
            </a>
          </div>

          {/* Note; Save + Clear Buttons */}
          <div className="button-wrapper">
            <button type="submit" className="submit-btn">
              Save Round
            </button>
            <button type="button" className="clear-btn" onClick={handleClear}>
              Clear Rounds
            </button>
          </div>
        </form>

        {/* Note; Display Handicap Index */}
        <div className="handicap-info">
          <h2>Your Handicap Index</h2>
          <p className="handicap-value">
            {handicap !== null ? handicap.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Note; History List */}
      <div className="history-card">
        <h3>Previous Rounds</h3>
        {rounds.length === 0 ? (
          <p>No rounds recorded yet.</p>
        ) : (
          <div className="rounds-list">
            {rounds.map((r, i) => (
              <div key={i} className="round-card">
                <p>
                  <strong>Gross:</strong> {r.adjustedGrossScore}
                </p>
                <p>
                  <strong>Course:</strong> {r.courseRating}
                </p>
                <p>
                  <strong>Slope:</strong> {r.slopeRating}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HandicapTracker;
