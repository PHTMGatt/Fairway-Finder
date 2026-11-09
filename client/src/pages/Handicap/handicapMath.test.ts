import { describe, expect, it } from 'vitest';
import { parseRoundInput, scoreDifferential } from './handicapMath';

describe('handicap math', () => {
  it('computes the WHS score differential from rating and slope', () => {
    // (90 - 70.4) * 113 / 125 = 17.7184 -> 17.7
    expect(scoreDifferential(90, 70.4, 125)).toBe(17.7);
    // Neutral slope 113: differential is just gross - rating
    expect(scoreDifferential(80, 72, 113)).toBe(8);
  });

  it('accepts typed scorecard numbers without any course API', () => {
    expect(parseRoundInput('88', '69.8', '121')).toEqual({ ok: true, gross: 88, rating: 69.8, slope: 121 });
  });

  it('rejects missing or out-of-range values with a plain message', () => {
    expect(parseRoundInput('', '70', '120').ok).toBe(false);
    expect(parseRoundInput('90', '', '120').ok).toBe(false);
    expect(parseRoundInput('90', '70', '300').ok).toBe(false);
    const bad = parseRoundInput('90', '12', '120');
    expect(bad.ok === false && bad.message).toMatch(/scorecard/);
  });
});
