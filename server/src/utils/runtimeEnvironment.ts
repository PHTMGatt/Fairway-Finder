export type RuntimeEnvironment = Record<string, string | undefined>;

const hasValue = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const CORE_REQUIREMENTS = ['MONGODB_URI', 'JWT_SECRET_KEY'] as const;

export const getMissingCoreEnvironment = (
  env: RuntimeEnvironment = process.env
): string[] =>
  CORE_REQUIREMENTS.filter((key) => !hasValue(env[key]));

export const getProviderCapabilities = (
  env: RuntimeEnvironment = process.env
) => ({
  google: hasValue(env.PLACES_API_KEY),
  golf: hasValue(env.GOLF_API_KEY),
});
