import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScoreInput } from './ScoreCard';
import { scorecardErrorMessage } from './scorecardUtils';

describe('score entry guardrails', () => {
  it('renders a hole score input capped at 30', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScoreInput, { value: 4, onChange: () => undefined })
    );
    expect(markup).toContain('min="0"');
    expect(markup).toContain('max="30"');
  });

  it('normalizes mutation failures into an inline save message', () => {
    expect(scorecardErrorMessage(new Error('Trip not found'))).toBe('Trip not found');
    expect(scorecardErrorMessage({})).toBe('Could not save scorecard changes. Please try again.');
  });
});
