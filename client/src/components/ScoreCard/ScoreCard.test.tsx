import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScoreInput } from './ScoreCard';
import { scorecardErrorMessage, scoreFromDraft } from './scorecardUtils';

describe('score entry guardrails', () => {
  it('renders a hole score input capped at 30', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScoreInput, { value: 4, onCommit: () => true })
    );
    expect(markup).toContain('min="0"');
    expect(markup).toContain('max="30"');
  });

  it('commits only complete integer scores between 0 and 30', () => {
    expect(scoreFromDraft('')).toBeNull();
    expect(scoreFromDraft('4')).toBe(4);
    expect(scoreFromDraft('10')).toBe(10);
    expect(scoreFromDraft('-1')).toBeNull();
    expect(scoreFromDraft('31')).toBeNull();
    expect(scoreFromDraft('4.5')).toBeNull();
    expect(scoreFromDraft('nope')).toBeNull();
  });

  it('normalizes mutation failures into an inline save message', () => {
    expect(scorecardErrorMessage(new Error('Trip not found'))).toBe('Trip not found');
    expect(scorecardErrorMessage({})).toBe('Could not save scorecard changes. Please try again.');
  });
});

import { holesPlayed, nextOpenHole, roundDifferential, stepScore } from './scorecardUtils';

describe('hole-by-hole helpers', () => {
  const full = (n: number) => Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`H${i + 1}`, n]));

  it('first + on an empty hole jumps to 4, then steps by one, clamped 0..30', () => {
    expect(stepScore(0, 1)).toBe(4);
    expect(stepScore(0, -1)).toBe(0);
    expect(stepScore(4, 1)).toBe(5);
    expect(stepScore(1, -1)).toBe(0);
    expect(stepScore(30, 1)).toBe(30);
  });

  it('counts played holes and finds the next open hole across players', () => {
    expect(holesPlayed(null)).toBe(0);
    expect(holesPlayed({ H1: 4, H2: 0, H3: 5 })).toBe(2);
    expect(nextOpenHole([{ H1: 4, H2: 5 }, { H1: 3 }])).toBe(2);
    expect(nextOpenHole([full(4)])).toBe(18);
    expect(nextOpenHole([])).toBe(18);
  });

  it('computes the handicap differential only for a complete round with rating + slope', () => {
    expect(roundDifferential(full(5), 72.1, 128)).toBe(15.8); // (90-72.1)*113/128 = 15.80
    expect(roundDifferential({ ...full(5), H18: 0 }, 72.1, 128)).toBeNull();
    expect(roundDifferential(full(5), null, 128)).toBeNull();
  });
});
