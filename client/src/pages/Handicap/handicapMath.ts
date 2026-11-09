// Score differential math for the Handicap Tracker.
// Works from the course rating + slope printed on any scorecard, so no paid
// course-data API is required. (WHS: differential = (gross - rating) * 113 / slope.)

export const RATING_RANGE = { min: 55, max: 85 } as const;
export const SLOPE_RANGE = { min: 55, max: 155 } as const;
export const GROSS_RANGE = { min: 18, max: 200 } as const;

export type RoundInputResult =
  | { ok: true; gross: number; rating: number; slope: number }
  | { ok: false; message: string };

const inRange = (value: number, range: { min: number; max: number }) =>
  Number.isFinite(value) && value >= range.min && value <= range.max;

export const parseRoundInput = (gross: string, rating: string, slope: string): RoundInputResult => {
  const g = Number.parseFloat(gross);
  const r = Number.parseFloat(rating);
  const s = Number.parseFloat(slope);

  if (!inRange(g, GROSS_RANGE)) {
    return { ok: false, message: `Enter a gross score between ${GROSS_RANGE.min} and ${GROSS_RANGE.max}.` };
  }
  if (!inRange(r, RATING_RANGE)) {
    return {
      ok: false,
      message: `Course rating should be between ${RATING_RANGE.min} and ${RATING_RANGE.max} (it's on the scorecard, e.g. 70.4).`,
    };
  }
  if (!inRange(s, SLOPE_RANGE)) {
    return {
      ok: false,
      message: `Slope should be between ${SLOPE_RANGE.min} and ${SLOPE_RANGE.max} (it's on the scorecard, e.g. 125).`,
    };
  }
  return { ok: true, gross: g, rating: r, slope: s };
};

/** Score differential rounded to one decimal place. */
export const scoreDifferential = (gross: number, rating: number, slope: number): number =>
  Math.round((((gross - rating) * 113) / slope) * 10) / 10;
