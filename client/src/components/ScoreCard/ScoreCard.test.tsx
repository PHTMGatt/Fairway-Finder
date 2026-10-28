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
