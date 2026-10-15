import { UserInputError } from 'apollo-server-errors';

export function boundedText(value: unknown, label: string, max = 120): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new UserInputError(`${label} must be between 1 and ${max} characters.`);
  return value.trim();
}
export function validScore(hole: number, score: number): void {
  if (!Number.isInteger(hole) || hole < 1 || hole > 18) throw new UserInputError('Hole must be an integer from 1 to 18.');
  if (!Number.isInteger(score) || score < 0 || score > 99) throw new UserInputError('Score must be an integer from 0 to 99.');
}
export function validHandicap(handicap: number): void {
  if (!Number.isFinite(handicap) || handicap < -10 || handicap > 54) throw new UserInputError('Handicap must be between -10 and 54.');
}
export function validTripDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new UserInputError('Enter a valid date in YYYY-MM-DD format.');
}
