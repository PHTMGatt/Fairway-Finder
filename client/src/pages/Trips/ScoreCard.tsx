import React, { useState } from 'react';
import './ScoreCard.css';

interface ScoreCardProps {
  tripId: string;
}

interface Player {
  id: string;
  name: string;
  scores: number[];
}

const initialPlayers: Player[] = [
  { id: '1', name: 'Player 1', scores: Array(18).fill(0) },
];

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId }) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newName, setNewName] = useState('');
  const [startHole, setStartHole] = useState(0);
  const holes = Array.from({ length: 9 }, (_, i) => startHole + i + 1);

  const handleAddPlayer = () => {
    if (!newName.trim()) return;
    setPlayers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        scores: Array(18).fill(0),
      },
    ]);
    setNewName('');
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleScoreChange = (
    playerId: string,
    holeIndex: number,
    newScore: number
  ) => {
    setPlayers((prev) =>
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
      <div className="scorecard__header">
        <h4 className="scorecard__title">Holes {startHole + 1}–{startHole + 9}</h4>
        <div className="scorecard__nav">
          <button onClick={() => setStartHole(0)} disabled={startHole === 0} className="scorecard__btn">Front 9</button>
          <button onClick={() => setStartHole(9)} disabled={startHole === 9} className="scorecard__btn">Back 9</button>
        </div>
      </div>

      <table className="scorecard__table">
        <thead>
          <tr>
            <th>Player</th>
            {holes.map((h) => (
              <th key={h}>Hole {h}</th>
            ))}
            <th>Total</th>
            <th>✖</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const total = player.scores.slice(startHole, startHole + 9).reduce((a, b) => a + b, 0);
            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                {holes.map((h, i) => (
                  <td key={h}>
                    <input
                      type="number"
                      min="0"
                      className="scorecard__input"
                      value={player.scores[startHole + i]}
                      onChange={(e) =>
                        handleScoreChange(
                          player.id,
                          startHole + i,
                          parseInt(e.target.value || '0')
                        )
                      }
                    />
                  </td>
                ))}
                <td>{total}</td>
                <td>
                  <button className="scorecard__remove" onClick={() => handleRemovePlayer(player.id)}>🗑</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="scorecard__add-player">
        <input
          type="text"
          placeholder="Add player name"
          value={newName}
          className="scorecard__player-input"
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="scorecard__add-btn" onClick={handleAddPlayer}>Add Player</button>
      </div>
    </div>
  );
};

export default ScoreCard;
