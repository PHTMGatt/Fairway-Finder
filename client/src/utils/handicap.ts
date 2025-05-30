import { Round } from './roundStorage';

export function calculateDifferential(round: Round): number {
  const { adjustedGrossScore, courseRating, slopeRating } = round;
  return ((adjustedGrossScore - courseRating) * 113) / slopeRating;
}

export function calculateHandicapIndex(rounds: Round[]): number | null {
  if (rounds.length < 1) return null;

  const differentials = rounds.map(calculateDifferential).sort((a, b) => a - b);
  const count = Math.min(8, differentials.length);
  const average = differentials.slice(0, count).reduce((a, b) => a + b, 0) / count;

  return Math.round(average * 10) / 10; 
}