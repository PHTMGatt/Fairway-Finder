export const hasGoogleMapsKey = (value?: string | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;
