export interface RoutePlannerState {
  origin: string;
  destination: string;
  submitted: boolean;
}

export const createInitialRoutePlannerState = (): RoutePlannerState => ({
  origin: '',
  destination: '',
  submitted: false,
});

export const canPlanRoute = (origin: string, destination: string): boolean =>
  Boolean(origin.trim() && destination.trim());
