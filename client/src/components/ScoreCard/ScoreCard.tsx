// client/src/components/ScoreCard/ScoreCard.tsx
import React, { FormEvent, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_TRIP } from '../../utils/queries';
import { ADD_PLAYER, REMOVE_PLAYER, UPDATE_SCORE } from '../../utils/mutations';
import {
  getInitialScorecardView,
  scorecardErrorMessage,
  scoreFromDraft,
  ScorecardView,
} from './scorecardUtils';
import './ScoreCard.css';

interface PlayerSubdoc {
  name: string;
  score: Record<string, number>;
  total: number;
}

interface TripData {
  trip: {
    _id: string;
    players: PlayerSubdoc[];
  };
}

interface ScoreCardProps {
  tripId: string;
}

interface ScoreInputProps {
  value: number;
  onCommit: (score: number) => boolean | Promise<boolean>;
  ariaLabel?: string;
}

export const ScoreInput: React.FC<ScoreInputProps> = ({
  value,
  onCommit,
  ariaLabel,
}) => {
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

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId }) => {
  const { loading, error, data } = useQuery<TripData>(QUERY_TRIP, {
    variables: { id: tripId },
    fetchPolicy: 'cache-and-network',
  });

  const [addPlayer, { loading: addingPlayer }] = useMutation(ADD_PLAYER);
  const [removePlayer] = useMutation(REMOVE_PLAYER);
  const [updateScore] = useMutation(UPDATE_SCORE);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ScorecardView>(() =>
    getInitialScorecardView(typeof window === 'undefined' ? undefined : window.innerWidth)
  );
  const [threeHoleIndex, setThreeHoleIndex] = useState(0);

  const getHoleNumbers = (): number[] => {
    if (viewMode === 'front9') return Array.from({ length: 9 }, (_, i) => i + 1);
    if (viewMode === 'back9') return Array.from({ length: 9 }, (_, i) => i + 10);
    return [threeHoleIndex + 1, threeHoleIndex + 2, threeHoleIndex + 3];
  };
  const holeNumbers = getHoleNumbers();

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
    const confirmed = window.confirm(
      `Remove ${name} from this trip? Their saved hole scores will be removed too.`
    );
    if (!confirmed) return;

    setSaveError(null);
    try {
      await removePlayer({ variables: { tripId, name } });
    } catch (mutationError: unknown) {
      setSaveError(scorecardErrorMessage(mutationError));
    }
  };

  const handleScoreChange = async (
    playerName: string,
    hole: number,
    newScore: number
  ): Promise<boolean> => {
    setSaveError(null);
    try {
      await updateScore({
        variables: { tripId, player: playerName, hole, score: newScore },
      });
      return true;
    } catch (mutationError: unknown) {
      setSaveError(scorecardErrorMessage(mutationError));
      return false;
    }
  };

  const handleSlide = (direction: 'prev' | 'next') => {
    setThreeHoleIndex((previous) => {
      const next = direction === 'prev' ? previous - 1 : previous + 1;
      return Math.max(0, Math.min(next, 15));
    });
  };

  if (loading && !data?.trip) return <p className="scorecard__status">Loading scorecard…</p>;
  if (error || !data?.trip) {
    return <p className="scorecard__error">Error loading scorecard.</p>;
  }

  const players = data.trip.players;

  return (
    <div className="scorecard">
      <div className="scorecard__header">
        <div>
          <h3 className="scorecard__title">
            {viewMode === 'threehole'
              ? `Holes ${threeHoleIndex + 1}-${threeHoleIndex + 3}`
              : `Holes ${holeNumbers[0]}-${holeNumbers[holeNumbers.length - 1]}`}
          </h3>
          <p className="scorecard__hint">Scores save when you leave a field or press Enter.</p>
        </div>
        <div className="scorecard__nav" aria-label="Scorecard view">
          <button
            type="button"
            className="scorecard__btn"
            aria-pressed={viewMode === 'front9'}
            onClick={() => setViewMode('front9')}
          >
            Front 9
          </button>
          <button
            type="button"
            className="scorecard__btn"
            aria-pressed={viewMode === 'back9'}
            onClick={() => setViewMode('back9')}
          >
            Back 9
          </button>
          <button
            type="button"
            className="scorecard__btn"
            aria-pressed={viewMode === 'threehole'}
            onClick={() => setViewMode('threehole')}
          >
            3-Hole
          </button>
        </div>
      </div>

      {viewMode === 'threehole' && (
        <div className="scorecard__nav scorecard__slider">
          <button
            type="button"
            className="scorecard__btn"
            onClick={() => handleSlide('prev')}
            disabled={threeHoleIndex <= 0}
          >
            ← Prev
          </button>
          <button
            type="button"
            className="scorecard__btn"
            onClick={() => handleSlide('next')}
            disabled={threeHoleIndex >= 15}
          >
            Next →
          </button>
        </div>
      )}

      {saveError && (
        <p className="scorecard__error" role="alert">
          {saveError}
        </p>
      )}

      {players.length ? (
        <div className="scorecard__table-wrapper">
          <table
            className={`scorecard__table${
              viewMode === 'threehole' ? ' scorecard__table--compact' : ''
            }`}
          >
            <thead>
              <tr>
                <th>Player</th>
                {holeNumbers.map((hole) => (
                  <th key={hole}>H{hole}</th>
                ))}
                <th>Total</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.name}>
                  <th scope="row">{player.name}</th>
                  {holeNumbers.map((holeNum) => {
                    const key = `H${holeNum}`;
                    const value = player.score[key] ?? 0;
                    return (
                      <td key={holeNum}>
                        <ScoreInput
                          value={value}
                          ariaLabel={`${player.name}, hole ${holeNum}`}
                          onCommit={(score) =>
                            handleScoreChange(player.name, holeNum, score)
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="scorecard__total">{player.total}</td>
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
      ) : (
        <p className="scorecard__empty">Add a player to start keeping score.</p>
      )}

      <form className="scorecard__add-player" onSubmit={(event) => void handleAddPlayer(event)}>
        <label className="scorecard__player-field">
          <span>Player name</span>
          <input
            type="text"
            className="scorecard__player-input"
            placeholder="Player name"
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          className="scorecard__add-btn"
          disabled={addingPlayer || !newPlayerName.trim()}
        >
          {addingPlayer ? 'Adding…' : 'Add Player'}
        </button>
      </form>
    </div>
  );
};

export default ScoreCard;
