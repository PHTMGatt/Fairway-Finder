// src/components/ScoreCard/ScoreCard.tsx

import React, { useState } from 'react';
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

const ScoreCard: React.FC = () => {
  // Note; State for all players and their scores
  const [playerList, setPlayerList] = useState<Player[]>(defaultPlayers);

  // Note; State for the “Add Player” input field
  const [newPlayerName, setNewPlayerName] = useState<string>('');

  // Note; Which block of 9 holes to display (0 = holes 1–9, 9 = holes 10–18)
  const [currentStartHoleIndex, setCurrentStartHoleIndex] = useState<number>(0);

  // Note; Array of hole numbers to render as columns
  const holeNumbers = Array.from(
    { length: 9 },
    (_, i) => currentStartHoleIndex + i + 1
  );

  // Note; Handler to add a new player with empty scores
  const handleAddPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    setPlayerList((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: trimmedName,
        scores: Array(18).fill(0),
      },
    ]);
    setNewPlayerName(''); // Note; Clear input
  };

  // Note; Handler to remove a player by their ID
  const handleRemovePlayer = (playerId: string) => {
    setPlayerList((prev) => prev.filter((p) => p.id !== playerId));
  };

  // Note; Handler to update a specific player's score for a hole
  const handleScoreChange = (
    playerId: string,
    holeIndex: number,
    newScore: number
  ) => {
    setPlayerList((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              scores: p.scores.map((s, i) =>
                i === holeIndex ? newScore : s
              ),
            }
          : p
      )
    );
  };

  return (
    <div className="scorecard">
      {/* Note; Header with back/front 9 navigation */}
      <div className="scorecard__header">
        <h4 className="scorecard__title">
          Holes {currentStartHoleIndex + 1}–{currentStartHoleIndex + 9}
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

      {/* Note; Scores table */}
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
          {playerList.map((player) => {
            // Note; Sum of the displayed 9 holes
            const total = player.scores
              .slice(currentStartHoleIndex, currentStartHoleIndex + 9)
              .reduce((sum, val) => sum + val, 0);

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
                      onChange={(e) =>
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

      {/* Note; Add Player controls */}
      <div className="scorecard__add-player">
        <input
          type="text"
          className="scorecard__player-input"
          placeholder="Add player name"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
        />
        <button
          className="scorecard__add-btn"
          onClick={handleAddPlayer}
        >
          Add Player
        </button>
      </div>
    </div>
  );
};

export default ScoreCard;
