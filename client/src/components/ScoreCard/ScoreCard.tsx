// src/components/ScoreCard/'ScoreCard.tsx'
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_TRIP } from '../../utils/queries';
import { ADD_PLAYER, REMOVE_PLAYER, UPDATE_SCORE } from '../../utils/mutations';
import './ScoreCard.css';

//Note; remastered ScoreCard with stable structure, logic preserved
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

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId }) => {
  const { loading, error, data } = useQuery<TripData>(QUERY_TRIP, {
    variables: { id: tripId },
    fetchPolicy: 'network-only',
  });

  const [addPlayer] = useMutation(ADD_PLAYER, {
    refetchQueries: [{ query: QUERY_TRIP, variables: { id: tripId } }],
  });
  const [removePlayer] = useMutation(REMOVE_PLAYER, {
    refetchQueries: [{ query: QUERY_TRIP, variables: { id: tripId } }],
  });
  const [updateScore] = useMutation(UPDATE_SCORE, {
    refetchQueries: [{ query: QUERY_TRIP, variables: { id: tripId } }],
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  const [viewMode, setViewMode] = useState<'front9' | 'back9' | 'threehole'>('front9');
  const [threeHoleIndex, setThreeHoleIndex] = useState(0);

  const getHoleNumbers = (): number[] => {
    if (viewMode === 'front9') return Array.from({ length: 9 }, (_, i) => i + 1);
    if (viewMode === 'back9') return Array.from({ length: 9 }, (_, i) => i + 10);
    return [threeHoleIndex + 1, threeHoleIndex + 2, threeHoleIndex + 3];
  };
  const holeNumbers = getHoleNumbers();

  const handleAddPlayer = async () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    await addPlayer({ variables: { tripId, name: trimmed } });
    setNewPlayerName('');
  };

  const handleRemovePlayer = async (name: string) => {
    await removePlayer({ variables: { tripId, name } });
  };

  const handleScoreChange = async (
    playerName: string,
    hole: number,
    newScore: number
  ) => {
    await updateScore({
      variables: { tripId, player: playerName, hole, score: newScore },
    });
  };

  const handleSlide = (direction: 'prev' | 'next') => {
    setThreeHoleIndex((prev) => {
      const next = direction === 'prev' ? prev - 1 : prev + 1;
      return Math.max(0, Math.min(next, 15));
    });
  };

  if (loading) return <p>Loading scorecard…</p>;
  if (error || !data?.trip) return <p>❌ Error loading scorecard</p>;

  const players = data.trip.players;

  return (
    <div className="scorecard">
      {/*Note; header and view toggles */}
      <div className="scorecard__header">
        <h4 className="scorecard__title">
          {viewMode === 'threehole'
            ? `Holes ${threeHoleIndex + 1}-${threeHoleIndex + 3}`
            : `Holes ${holeNumbers[0]}-${holeNumbers[holeNumbers.length - 1]}`}
        </h4>
        <div className="scorecard__nav">
          <button className="scorecard__btn" onClick={() => setViewMode('front9')}>
            Front 9
          </button>
          <button className="scorecard__btn" onClick={() => setViewMode('back9')}>
            Back 9
          </button>
          <button className="scorecard__btn" onClick={() => setViewMode('threehole')}>
            3-Hole View
          </button>
        </div>
      </div>

      {/*Note; 3-hole nav buttons */}
      {viewMode === 'threehole' && (
        <div className="scorecard__nav scorecard__slider">
          <button
            className="scorecard__btn"
            onClick={() => handleSlide('prev')}
            disabled={threeHoleIndex <= 0}
          >
            ← Prev
          </button>
          <button
            className="scorecard__btn"
            onClick={() => handleSlide('next')}
            disabled={threeHoleIndex >= 15}
          >
            Next →
          </button>
        </div>
      )}

      {/*Note; score entry table */}
      <div className="scorecard__table-wrapper">
        <table className="scorecard__table">
          <thead>
            <tr>
              <th>Player</th>
              {holeNumbers.map((h) => (
                <th key={h}>Hole {h}</th>
              ))}
              <th>Total</th>
              <th>✖</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.name}>
                <td>{player.name}</td>
                {holeNumbers.map((holeNum) => {
                  const key = `H${holeNum}`;
                  const val = player.score[key] ?? 0;
                  return (
                    <td key={holeNum}>
                      <input
                        type="number"
                        min={0}
                        className="scorecard__input"
                        value={val}
                        onChange={(e) =>
                          handleScoreChange(
                            player.name,
                            holeNum,
                            parseInt(e.target.value || '0', 10)
                          )
                        }
                      />
                    </td>
                  );
                })}
                <td>{player.total}</td>
                <td>
                  <button
                    className="scorecard__remove"
                    onClick={() => handleRemovePlayer(player.name)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*Note; add player section */}
      <div className="scorecard__add-player">
        <input
          type="text"
          className="scorecard__player-input"
          placeholder="Add player name"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
        />
        <button className="scorecard__add-btn" onClick={handleAddPlayer}>
          Add Player
        </button>
      </div>
    </div>
  );
};

export default ScoreCard;
