export interface RoutePlannerState {
  origin: string;
  destination: string;
  submitted: boolean;
}

const cleanText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const readRoutePlannerPrefill = (state: unknown): RoutePlannerState => {
  if (!state || typeof state !== 'object') {
    return { origin: '', destination: '', submitted: false };
  }

  const candidate = state as { origin?: unknown; destination?: unknown };
  return {
    origin: cleanText(candidate.origin),
    destination: cleanText(candidate.destination),
    submitted: false,
  };
};

export const createInitialRoutePlannerState = (): RoutePlannerState =>
  readRoutePlannerPrefill(null);

export const canPlanRoute = (origin: string, destination: string): boolean =>
  Boolean(origin.trim() && destination.trim());
