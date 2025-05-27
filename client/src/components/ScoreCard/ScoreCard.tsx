// src/components/ScoreCard/ScoreCard.tsx

import React, { useState, useEffect } from 'react';
import './ScoreCard.css';

interface Player {
  id: string;
  name: string;
  scores: number[];
}

// Note; Initial default player list with 18 empty scores
const defaultPlayers: Player[] = [
  { id: '1', name: 'Player 1', scores: Array(18).fill(0) },
];

// Define props for ScoreCard
interface ScoreCardProps {
  tripId: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId }) => {
  // Load from localStorage if present, else default players
  const [playerList, setPlayerList] = useState<Player[]>(() => {
    const saved = localStorage.getItem(`scores-${tripId}`);
    return saved ? (JSON.parse(saved) as Player[]) : defaultPlayers;
  });

  // Persist to localStorage whenever playerList changes
  useEffect(() => {
    localStorage.setItem(`scores-${tripId}`, JSON.stringify(playerList));
  }, [tripId, playerList]);

  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [currentStartHoleIndex, setCurrentStartHoleIndex] = useState<number>(0);

  const holeNumbers = Array.from(
    { length: 9 },
    (_, i) => currentStartHoleIndex + i + 1
  );

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayerList(prev => [
      ...prev,
      { id: Date.now().toString(), name: trimmed, scores: Array(18).fill(0) }
    ]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (playerId: string) => {
    setPlayerList(prev => prev.filter(p => p.id !== playerId));
  };

  const handleScoreChange = (
    playerId: string,
    holeIndex: number,
    newScore: number
  ) => {
    setPlayerList(prev =>
      prev.map(p =>
        p.id === playerId
          ? {
              ...p,
              scores: p.scores.map((s, i) => (i === holeIndex ? newScore : s)),
            }
          : p
      )
    );
  };

  return (
    <div className="scorecard">
      {/* Header/nav */}
      <div className="scorecard__header">
        <h4 className="scorecard__title">
          Holes {currentStartHoleIndex + 1}-{currentStartHoleIndex + 9}
        </h4>
        <div className="scorecard__nav">
          <button
            className="scorecard__btn"
            onClick={() => setCurrentStartHoleIndex(0)}
            disabled={currentStartHoleIndex === 0}
          >
            Front 9
          </button>
          <button
            className="scorecard__btn"
            onClick={() => setCurrentStartHoleIndex(9)}
            disabled={currentStartHoleIndex === 9}
          >
            Back 9
          </button>
        </div>
      </div>

      {/* Score table */}
      <table className="scorecard__table">
        <thead>
          <tr>
            <th>Player</th>
            {holeNumbers.map(h => (
              <th key={h}>Hole {h}</th>
            ))}
            <th>Total</th>
            <th>✖</th>
          </tr>
        </thead>
        <tbody>
          {playerList.map(player => {
            const total = player.scores
              .slice(currentStartHoleIndex, currentStartHoleIndex + 9)
              .reduce((sum, v) => sum + v, 0);

            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                {holeNumbers.map((_, idx) => (
                  <td key={idx}>
                    <input
                      type="number"
                      min="0"
                      className="scorecard__input"
                      value={player.scores[currentStartHoleIndex + idx]}
                      onChange={e =>
                        handleScoreChange(
                          player.id,
                          currentStartHoleIndex + idx,
                          parseInt(e.target.value || '0', 10)
                        )
                      }
                    />
                  </td>
                ))}
                <td>{total}</td>
                <td>
                  <button
                    className="scorecard__remove"
                    onClick={() => handleRemovePlayer(player.id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Add player */}
      <div className="scorecard__add-player">
        <input
          type="text"
          className="scorecard__player-input"
          placeholder="Add player name"
          value={newPlayerName}
          onChange={e => setNewPlayerName(e.target.value)}
        />
        <button className="scorecard__add-btn" onClick={handleAddPlayer}>
          Add Player
        </button>
      </div>
    </div>
  );
};

export default ScoreCard;
