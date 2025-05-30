export type Round = {
  adjustedGrossScore: number;
  courseRating: number;
  slopeRating: number;
  date: string;
};

const STORAGE_KEY = 'golfRounds';

export function saveRound(round: Round): void {
  const rounds = getRounds();
  rounds.push(round);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
}

export function getRounds(): Round[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function clearRounds(): void {
  localStorage.removeItem(STORAGE_KEY);
}