// client/src/components/ScoreCard/ScoreCard.tsx
// Phone-first scorecard: hole by hole (default) or the full card. Handicap fills in
// automatically once a player has all 18 holes and the course rating/slope are known.
import React, { FormEvent, useEffect, useState } from 'react';
import Notice from '../ui/Notice';
import { Button, Field } from '../ui/primitives';
import CardView from './CardView';
import HoleView from './HoleView';
import { holesPlayed, nextOpenHole, roundDifferential } from './scorecardUtils';
import { PlayerSubdoc, useScorecard } from './useScorecard';
import './ScoreCard.css';

export { default as ScoreInput } from './ScoreInput';

interface ScoreCardProps {
  tripId: string;
  /** Tee rating + slope for the trip course, when known: enables the automatic handicap. */
  courseRating?: number | null;
  slope?: number | null;
}

const handicapLabel = (player: PlayerSubdoc, courseRating?: number | null, slope?: number | null) => {
  const diff = roundDifferential(player.score, courseRating, slope);
  if (diff !== null) return `Handicap ${diff.toFixed(1)}`;
  return courseRating && slope
    ? `Handicap after 18 (${holesPlayed(player.score)}/18)`
    : 'Handicap needs course rating';
};

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId, courseRating, slope }) => {
  const { trip, loading, error, players, addingPlayer, saveError, add, remove, setScore } =
    useScorecard(tripId, courseRating, slope);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [mode, setMode] = useState<'hole' | 'card'>('hole');
  const [hole, setHole] = useState<number | null>(null);

  // Open on the first hole nobody has scored yet, so reopening mid-round lands in the right place.
  useEffect(() => {
    if (hole === null && trip) setHole(nextOpenHole(trip.players.map((p) => p.score)));
  }, [trip, hole]);

  const handleAddPlayer = async (event: FormEvent) => {
    event.preventDefault();
    const name = newPlayerName.trim();
    if (name && (await add(name))) setNewPlayerName('');
  };

  if (loading && !trip) return <Notice>Loading scorecard…</Notice>;
  if (error || !trip) return <Notice tone="danger">Error loading scorecard.</Notice>;

  return (
    <div className="scorecard">
      <div className="scorecard__modes" role="tablist" aria-label="Scorecard view">
        <button type="button" role="tab" aria-selected={mode === 'hole'} className="scorecard__mode" onClick={() => setMode('hole')}>
          Hole by hole
        </button>
        <button type="button" role="tab" aria-selected={mode === 'card'} className="scorecard__mode" onClick={() => setMode('card')}>
          Full card
        </button>
      </div>

      {saveError && (
        <Notice tone="danger" className="scorecard__alert">
          {saveError}
        </Notice>
      )}

      {!players.length && (
        <p className="scorecard__empty">Add who&apos;s playing below, then tap + and − on each hole.</p>
      )}

      {players.length > 0 && mode === 'hole' && (
        <HoleView
          players={players}
          hole={hole ?? 1}
          onHole={setHole}
          onScore={(name, h, score) => void setScore(name, h, score)}
          onFinish={() => setMode('card')}
        />
      )}

      {players.length > 0 && mode === 'card' && (
        <CardView players={players} onScore={setScore} onRemove={(name) => void remove(name)} />
      )}

      {players.length > 0 && (
        <ul className="scorecard__summary" aria-label="Totals">
          {players.map((player) => (
            <li key={player.name}>
              <span>{player.name}</span>
              <strong>{player.total ?? 0}</strong>
              <small>{handicapLabel(player, courseRating, slope)}</small>
            </li>
          ))}
        </ul>
      )}

      <form className="scorecard__add-player" onSubmit={(event) => void handleAddPlayer(event)}>
        <Field label="Add a player">
          <input
            type="text"
            placeholder="Name (e.g. Mom)"
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            autoComplete="off"
            maxLength={40}
          />
        </Field>
        <Button type="submit" disabled={addingPlayer || !newPlayerName.trim()}>
          {addingPlayer ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  );
};

export default ScoreCard;
