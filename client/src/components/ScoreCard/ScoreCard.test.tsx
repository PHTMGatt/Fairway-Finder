import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as ScoreCardModule from './ScoreCard';

describe('score entry guardrails', () => {
  it('renders a hole score input capped at 30', () => {
    const ScoreInput = (ScoreCardModule as any).ScoreInput;
    expect(ScoreInput).toBeDefined();

    const markup = renderToStaticMarkup(
      React.createElement(ScoreInput, { value: 4, onChange: () => undefined })
    );
    expect(markup).toContain('min="0"');
    expect(markup).toContain('max="30"');
  });

  it('normalizes mutation failures into an inline save message', () => {
    const messageFor = (ScoreCardModule as any).scorecardErrorMessage;
    expect(messageFor).toBeDefined();
    expect(messageFor(new Error('Trip not found'))).toBe('Trip not found');
    expect(messageFor({})).toBe('Could not save scorecard changes. Please try again.');
  });
});
