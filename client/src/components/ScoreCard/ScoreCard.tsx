// client/src/components/ScoreCard/ScoreCard.tsx
// Phone-first scorecard: one hole at a time with big − / + steppers (default),
// plus a full 9-hole card for desktop/review. Handicap fills in automatically
// once a player has all 18 holes and the course rating/slope are known.
import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_TRIP } from '../../utils/queries';
import { ADD_PLAYER, REMOVE_PLAYER, UPDATE_PLAYER_HANDICAP, UPDATE_SCORE } from '../../utils/mutations';
import {
  HOLES,
  holesPlayed,
  nextOpenHole,
  roundDifferential,
  scorecardErrorMessage,
  scoreFromDraft,
  stepScore,
} from './scorecardUtils';
import './ScoreCard.css';

interface PlayerSubdoc {
  name: string;
  score: Record<string, number> | null;
  total: number;
  handicap?: number | null;
}

interface TripData {
  trip: {
    _id: string;
    players: PlayerSubdoc[];
  };
}

interface ScoreCardProps {
  tripId: string;
  /** Tee rating + slope for the trip course, when known: enables the automatic handicap. */
  courseRating?: number | null;
  slope?: number | null;
}

interface ScoreInputProps {
  value: number;
  onCommit: (score: number) => boolean | Promise<boolean>;
  ariaLabel?: string;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({ value, onCommit, ariaLabel }) => {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = async () => {
    const score = scoreFromDraft(draft);
    if (score === null) {
      setDraft(String(value));
      return;
    }
    if (score === value) return;

    setSaving(true);
    try {
      const saved = await onCommit(score);
      if (!saved) setDraft(String(value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="number"
      min={0}
      max={30}
      step={1}
      inputMode="numeric"
      className="scorecard__input"
      value={draft}
      aria-label={ariaLabel}
      disabled={saving}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commitDraft()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          setDraft(String(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
};

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId, courseRating, slope }) => {
  const { loading, error, data } = useQuery<TripData>(QUERY_TRIP, {
    variables: { id: tripId },
    fetchPolicy: 'cache-and-network',
  });

  const [addPlayer, { loading: addingPlayer }] = useMutation(ADD_PLAYER);
  const [removePlayer] = useMutation(REMOVE_PLAYER);
  const [updateScore] = useMutation(UPDATE_SCORE);
  const [updatePlayerHandicap] = useMutation(UPDATE_PLAYER_HANDICAP);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mode, setMode] = useState<'hole' | 'card'>('hole');
  const [half, setHalf] = useState<'front' | 'back'>('front');
  const [hole, setHole] = useState<number | null>(null);
  const savedHandicaps = useRef(new Map<string, number>());

  const players = useMemo(() => data?.trip?.players ?? [], [data?.trip?.players]);

  // Open on the first hole nobody has scored yet, so reopening mid-round lands in the right place.
  useEffect(() => {
    if (hole === null && data?.trip) setHole(nextOpenHole(data.trip.players.map((p) => p.score)));
  }, [data?.trip, hole]);

  // Automatic handicap: once a player has all 18 holes and rating/slope are known,
  // store the score differential as their handicap index (once per value).
  useEffect(() => {
    for (const player of players) {
      const diff = roundDifferential(player.score, courseRating, slope);
      if (diff === null || player.handicap === diff || savedHandicaps.current.get(player.name) === diff) continue;
      savedHandicaps.current.set(player.name, diff);
      void updatePlayerHandicap({ variables: { tripId, name: player.name, handicap: diff } }).catch(() => {
        savedHandicaps.current.delete(player.name);
      });
    }
  }, [players, courseRating, slope, tripId, updatePlayerHandicap]);

  const handleAddPlayer = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setSaveError(null);
    try {
      await addPlayer({ variables: { tripId, name: trimmed } });
      setNewPlayerName('');
    } catch (mutationError: unknown) {
      setSaveError(scorecardErrorMessage(mutationError));
    }
  };

  const handleRemovePlayer = async (name: string) => {
    if (!window.confirm(`Remove ${name}? Their scores on this trip will be deleted too.`)) return;
    setSaveError(null);
    try {
      await removePlayer({ variables: { tripId, name } });
    } catch (mutationError: unknown) {
      setSaveError(scorecardErrorMessage(mutationError));
    }
  };

  const handleScoreChange = async (playerName: string, holeNum: number, newScore: number): Promise<boolean> => {
    setSaveError(null);
    const player = players.find((p) => p.name === playerName);
    const nextScore = { ...(player?.score ?? {}), [`H${holeNum}`]: newScore };
    const nextTotal = HOLES.reduce((sum, h) => sum + (nextScore[`H${h}`] ?? 0), 0);
    try {
      await updateScore({
        variables: { tripId, player: playerName, hole: holeNum, score: newScore },
        // Instant feedback on the course: the number changes on tap, the server confirms after.
        optimisticResponse: {
          updateScore: {
            __typename: 'Trip',
            _id: tripId,
            players: players.map((p) => ({
              __typename: 'Player',
              name: p.name,
              handicap: p.handicap ?? null,
              score: p.name === playerName ? nextScore : p.score,
              total: p.name === playerName ? nextTotal : p.total,
            })),
          },
        },
      });
      return true;
    } catch (mutationError: unknown) {
      setSaveError(scorecardErrorMessage(mutationError));
      return false;
    }
  };

  if (loading && !data?.trip) return <p className="scorecard__status">Loading scorecard…</p>;
  if (error || !data?.trip) return <p className="scorecard__error">Error loading scorecard.</p>;

  const current = hole ?? 1;
  const cardHoles = half === 'front' ? HOLES.slice(0, 9) : HOLES.slice(9);

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
        <p className="scorecard__error" role="alert">
          {saveError}
        </p>
      )}

      {!players.length && (
        <p className="scorecard__empty">Add who&apos;s playing below, then tap + and − on each hole.</p>
      )}

      {players.length > 0 && mode === 'hole' && (
        <div className="scorecard__hole">
          <div className="scorecard__hole-head">
            <button
              type="button"
              className="scorecard__arrow"
              onClick={() => setHole(Math.max(1, current - 1))}
              disabled={current <= 1}
              aria-label="Previous hole"
            >
              ‹
            </button>
            <div className="scorecard__hole-title">
              <span>Hole</span>
              <strong>{current}</strong>
              <span>of 18</span>
            </div>
            <button
              type="button"
              className="scorecard__arrow"
              onClick={() => setHole(Math.min(18, current + 1))}
              disabled={current >= 18}
              aria-label="Next hole"
            >
              ›
            </button>
          </div>

          <div className="scorecard__dots" aria-label="Jump to hole">
            {HOLES.map((h) => {
              const done = players.every((p) => (p.score?.[`H${h}`] ?? 0) > 0);
              return (
                <button
                  key={h}
                  type="button"
                  className={`scorecard__dot${h === current ? ' is-current' : ''}${done ? ' is-done' : ''}`}
                  onClick={() => setHole(h)}
                  aria-label={`Hole ${h}${done ? ', scored' : ''}`}
                  aria-current={h === current ? 'step' : undefined}
                >
                  {h}
                </button>
              );
            })}
          </div>

          <ul className="scorecard__players">
            {players.map((player) => {
              const value = player.score?.[`H${current}`] ?? 0;
              const played = holesPlayed(player.score);
              return (
                <li key={player.name} className="scorecard__player">
                  <div className="scorecard__who">
                    <strong>{player.name}</strong>
                    <span>
                      {player.total ?? 0} total{played ? ` · thru ${played}` : ''}
                    </span>
                  </div>
                  <div className="scorecard__stepper">
                    <button
                      type="button"
                      className="scorecard__step"
                      onClick={() => void handleScoreChange(player.name, current, stepScore(value, -1))}
                      disabled={value === 0}
                      aria-label={`${player.name}: one less on hole ${current}`}
                    >
                      −
                    </button>
                    <output className={`scorecard__value${value ? '' : ' is-empty'}`} aria-live="polite">
                      {value || '–'}
                    </output>
                    <button
                      type="button"
                      className="scorecard__step scorecard__step--plus"
                      onClick={() => void handleScoreChange(player.name, current, stepScore(value, 1))}
                      aria-label={`${player.name}: one more on hole ${current}`}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {current < 18 ? (
            <button type="button" className="scorecard__next" onClick={() => setHole(current + 1)}>
              Next hole → {current + 1}
            </button>
          ) : (
            <button type="button" className="scorecard__next" onClick={() => setMode('card')}>
              See the full card
            </button>
          )}
          <p className="scorecard__hint">First tap of + sets 4. Scores save instantly.</p>
        </div>
      )}

      {players.length > 0 && mode === 'card' && (
        <>
          <div className="scorecard__nav" aria-label="Nine">
            <button type="button" className="scorecard__btn" aria-pressed={half === 'front'} onClick={() => setHalf('front')}>
              Front 9
            </button>
            <button type="button" className="scorecard__btn" aria-pressed={half === 'back'} onClick={() => setHalf('back')}>
              Back 9
            </button>
          </div>
          <div className="scorecard__table-wrapper">
            <table className="scorecard__table">
              <thead>
                <tr>
                  <th>Player</th>
                  {cardHoles.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  <th>Total</th>
                  <th>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.name}>
                    <th scope="row">{player.name}</th>
                    {cardHoles.map((h) => (
                      <td key={h}>
                        <ScoreInput
                          value={player.score?.[`H${h}`] ?? 0}
                          ariaLabel={`${player.name}, hole ${h}`}
                          onCommit={(score) => handleScoreChange(player.name, h, score)}
                        />
                      </td>
                    ))}
                    <td className="scorecard__total">{player.total ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="scorecard__remove"
                        onClick={() => void handleRemovePlayer(player.name)}
                        aria-label={`Remove ${player.name}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {players.length > 0 && (
        <div className="scorecard__summary">
          {players.map((player) => {
            const diff = roundDifferential(player.score, courseRating, slope);
            return (
              <div key={player.name} className="scorecard__summary-item">
                <span>{player.name}</span>
                <strong>{player.total ?? 0}</strong>
                <small>
                  {diff !== null
                    ? `Handicap ${diff.toFixed(1)}`
                    : courseRating && slope
                      ? `Handicap after 18 (${holesPlayed(player.score)}/18)`
                      : 'Handicap needs course rating'}
                </small>
              </div>
            );
          })}
        </div>
      )}

      <form className="scorecard__add-player" onSubmit={(event) => void handleAddPlayer(event)}>
        <label className="scorecard__player-field">
          <span>Add a player</span>
          <input
            type="text"
            className="scorecard__player-input"
            placeholder="Name (e.g. Mom)"
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            autoComplete="off"
            maxLength={40}
          />
        </label>
        <button type="submit" className="scorecard__add-btn" disabled={addingPlayer || !newPlayerName.trim()}>
          {addingPlayer ? 'Adding…' : 'Add'}
        </button>
      </form>
    </div>
  );
};

export default ScoreCard;
