import React, { useState, useEffect } from 'react';
import './ScoreCard.css';

interface Player {
  id: string;
  name: string;
  scores: number[];
}

interface ScoreCardProps {
  tripId: string;
}

const defaultPlayers: Player[] = [
  { id: '1', name: 'Player 1', scores: Array(18).fill(0) },
];

const ScoreCard: React.FC<ScoreCardProps> = ({ tripId }) => {
  const [playerList, setPlayerList] = useState<Player[]>(() => {
    const saved = localStorage.getItem(`scores-${tripId}`);
    return saved ? (JSON.parse(saved) as Player[]) : defaultPlayers;
  });

  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'front9' | 'back9' | 'threehole'>('front9');
  const [threeHoleIndex, setThreeHoleIndex] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem(`scores-${tripId}`, JSON.stringify(playerList));
  }, [tripId, playerList]);

  const getHoleNumbers = (): number[] => {
    if (viewMode === 'front9') return Array.from({ length: 9 }, (_, i) => i + 1);
    if (viewMode === 'back9') return Array.from({ length: 9 }, (_, i) => i + 10);
    return [threeHoleIndex + 1, threeHoleIndex + 2, threeHoleIndex + 3];
  };

  const holeNumbers = getHoleNumbers();

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

  const handleScoreChange = (playerId: string, holeIndex: number, newScore: number) => {
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

  const handleSlide = (direction: 'prev' | 'next') => {
    setThreeHoleIndex(prev => {
      const newIndex = direction === 'prev' ? prev - 1 : prev + 1;
      return Math.max(0, Math.min(newIndex, 15));
    });
  };

  return (
    <div className="scorecard">
      {/* Header & mode toggles */}
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

      {viewMode === 'threehole' && (
        <div className="scorecard__nav" style={{ justifyContent: 'center' }}>
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
            const total = holeNumbers.reduce(
              (sum, holeNum) => sum + player.scores[holeNum - 1],
              0
            );

            return (
              <tr key={player.id}>
                <td>{player.name}</td>
                {holeNumbers.map(holeNum => (
                  <td key={holeNum}>
                    <input
                      type="number"
                      min="0"
                      className="scorecard__input"
                      value={player.scores[holeNum - 1]}
                      onChange={e =>
                        handleScoreChange(
                          player.id,
                          holeNum - 1,
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
