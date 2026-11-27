// client/src/components/ScoreCard/HoleView.tsx
// Phone-first view: one hole at a time with big − / + steppers.
import React from 'react';
import { Button } from '../ui/primitives';
import { HOLES, holesPlayed, stepScore } from './scorecardUtils';
import { PlayerSubdoc } from './useScorecard';

interface HoleViewProps {
  players: PlayerSubdoc[];
  hole: number;
  onHole: (hole: number) => void;
  onScore: (player: string, hole: number, score: number) => void;
  onFinish: () => void;
}

const HoleView: React.FC<HoleViewProps> = ({ players, hole, onHole, onScore, onFinish }) => (
  <div className="scorecard__hole">
    <div className="scorecard__hole-head">
      <button
        type="button"
        className="scorecard__arrow"
        onClick={() => onHole(Math.max(1, hole - 1))}
        disabled={hole <= 1}
        aria-label="Previous hole"
      >
        ‹
      </button>
      <div className="scorecard__hole-title">
        <span>Hole</span>
        <strong>{hole}</strong>
        <span>of 18</span>
      </div>
      <button
        type="button"
        className="scorecard__arrow"
        onClick={() => onHole(Math.min(18, hole + 1))}
        disabled={hole >= 18}
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
            className={`scorecard__dot${h === hole ? ' is-current' : ''}${done ? ' is-done' : ''}`}
            onClick={() => onHole(h)}
            aria-label={`Hole ${h}${done ? ', scored' : ''}`}
            aria-current={h === hole ? 'step' : undefined}
          >
            {h}
          </button>
        );
      })}
    </div>

    <ul className="scorecard__players">
      {players.map((player) => {
        const value = player.score?.[`H${hole}`] ?? 0;
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
                onClick={() => onScore(player.name, hole, stepScore(value, -1))}
                disabled={value === 0}
                aria-label={`${player.name}: one less on hole ${hole}`}
              >
                −
              </button>
              <output className={`scorecard__value${value ? '' : ' is-empty'}`} aria-live="polite">
                {value || '–'}
              </output>
              <button
                type="button"
                className="scorecard__step scorecard__step--plus"
                onClick={() => onScore(player.name, hole, stepScore(value, 1))}
                aria-label={`${player.name}: one more on hole ${hole}`}
              >
                +
              </button>
            </div>
          </li>
        );
      })}
    </ul>

    <Button variant="secondary" block onClick={() => (hole < 18 ? onHole(hole + 1) : onFinish())}>
      {hole < 18 ? `Next hole → ${hole + 1}` : 'See the full card'}
    </Button>
    <p className="scorecard__hint">First tap of + sets 4. Scores save instantly.</p>
  </div>
);

export default HoleView;
