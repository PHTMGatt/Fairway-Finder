import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather } from './weatherApi';

const reply = (ok: boolean, body: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchWeather', () => {
  it('requests /api/weather with the encoded params and returns the body', async () => {
    const body = { name: 'Austin', main: { temp: 70, humidity: 40 } };
    const fetchMock = reply(true, body);

    await expect(fetchWeather({ city: 'Austin, TX', date: '2026-12-01' })).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/weather?city=Austin%2C+TX&date=2026-12-01');
  });

  it('rejects when the response is not ok', async () => {
    reply(false, {});
    await expect(fetchWeather({ city: 'Nowhere' })).rejects.toThrow('Failed to fetch weather');
  });
});
