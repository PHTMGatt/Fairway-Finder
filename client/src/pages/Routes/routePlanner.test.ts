import { describe, expect, it } from 'vitest';
import { canPlanRoute, createInitialRoutePlannerState } from './routePlanner';

describe('route planner state', () => {
  it('starts empty and does not submit a route automatically', () => {
    expect(createInitialRoutePlannerState()).toEqual({
      origin: '',
      destination: '',
      submitted: false,
    });
  });

  it('requires both locations before planning a route', () => {
    expect(canPlanRoute('', '')).toBe(false);
    expect(canPlanRoute('Detroit, MI', '')).toBe(false);
    expect(canPlanRoute('', 'Ann Arbor, MI')).toBe(false);
    expect(canPlanRoute('Detroit, MI', 'Ann Arbor, MI')).toBe(true);
  });
});
