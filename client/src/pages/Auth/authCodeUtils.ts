// client/src/pages/Auth/authCodeUtils.ts
export const errorText = (err: unknown, fallback: string): string => {
  const gqlMessage = (err as { graphQLErrors?: Array<{ message?: string }> })?.graphQLErrors?.[0]?.message;
  if (gqlMessage) return gqlMessage;
  return err instanceof Error && err.message ? err.message : fallback;
};

/** Keep only digits, max 6 (handles pasted "123 456" or "Code: 123456"). */
export const cleanCode = (value: string) => value.replace(/\D/g, '').slice(0, 6);
