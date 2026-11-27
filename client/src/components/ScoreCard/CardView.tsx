// client/src/components/ScoreCard/CardView.tsx
// The full 9-hole card, for desktop and end-of-round review.
import React, { useState } from 'react';
import { Button } from '../ui/primitives';
import ScoreInput from './ScoreInput';
import { HOLES } from './scorecardUtils';
import { PlayerSubdoc } from './useScorecard';

interface CardViewProps {
  players: PlayerSubdoc[];
  onScore: (player: string, hole: number, score: number) => Promise<boolean>;
  onRemove: (player: string) => void;
}

const CardView: React.FC<CardViewProps> = ({ players, onScore, onRemove }) => {
  const [half, setHalf] = useState<'front' | 'back'>('front');
  const cardHoles = half === 'front' ? HOLES.slice(0, 9) : HOLES.slice(9);

  return (
    <>
      <div className="scorecard__nav" role="group" aria-label="Nine">
        <Button variant="secondary" aria-pressed={half === 'front'} onClick={() => setHalf('front')}>
          Front 9
        </Button>
        <Button variant="secondary" aria-pressed={half === 'back'} onClick={() => setHalf('back')}>
          Back 9
        </Button>
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
                <span className="ff-visually-hidden">Actions</span>
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
                      onCommit={(score) => onScore(player.name, h, score)}
                    />
                  </td>
                ))}
                <td className="scorecard__total">{player.total ?? 0}</td>
                <td>
                  <Button
                    variant="danger"
                    onClick={() => onRemove(player.name)}
                    aria-label={`Remove ${player.name}`}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CardView;
