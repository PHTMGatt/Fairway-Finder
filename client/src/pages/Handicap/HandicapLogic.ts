// client/src/pages/Handicap/HandicapLogic.ts

export type Round = {
  adjustedGrossScore: number;
  slopeRating: number;
  courseRating: number;
};

const STORAGE_KEY = 'golfRounds';

/** 
 * Note; Save a round under a trip ID in localStorage 
 * Structure: { tripId: [Round, Round, ...] }
 */
export function saveRound(tripId: string, round: Round): void {
  const all = getAllRounds();
  const rounds = all[tripId] || [];
  rounds.push(round);
  all[tripId] = rounds;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** 
 * Note; Retrieve all stored rounds (map of tripId → Round[]) 
 */
export function getAllRounds(): Record<string, Round[]> {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/** 
 * Note; Get only the rounds for a specific trip 
 */
export function getRounds(tripId: string): Round[] {
  return getAllRounds()[tripId] || [];
}

/** 
 * Note; Clear all rounds for a given trip 
 */
export function clearRounds(tripId: string): void {
  const all = getAllRounds();
  delete all[tripId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** 
 * Note; Calculate USGA handicap differential for one round 
 * Formula: ((Adjusted Gross - Course Rating) × 113) ÷ Slope Rating 
 */
export function calculateDifferential(r: Round): number {
  return ((r.adjustedGrossScore - r.courseRating) * 113) / r.slopeRating;
}

/** 
 * Note; Calculate overall handicap index from all rounds
 * Uses lowest 8 differentials, rounded to 1 decimal
 */
export function calculateHandicapIndex(rounds: Round[]): number | null {
  if (rounds.length === 0) return null;

  const diffs = rounds
    .map((r) => calculateDifferential(r))
    .sort((a, b) => a - b);

  const count = Math.min(8, diffs.length);
  const avg = diffs.slice(0, count).reduce((sum, v) => sum + v, 0) / count;
  return Math.round(avg * 10) / 10;
}
