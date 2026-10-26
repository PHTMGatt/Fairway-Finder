import fetch, { RequestInit, Response } from 'node-fetch';

export const DEFAULT_PROVIDER_TIMEOUT_MS = 8_000;

export const fetchWithTimeout = async (
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS
): Promise<Response> => {
  const duration =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_PROVIDER_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), duration);

  try {
    return await fetch(url, {
      ...init,
      // node-fetch v2 carries its own AbortSignal declaration; Node 20's
      // runtime signal is compatible even though the bundled TS shapes differ.
      signal: controller.signal as unknown as NonNullable<RequestInit['signal']>,
    });
  } finally {
    clearTimeout(timeout);
  }
};
