import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCourses } from './courseApi';

const reply = (ok: boolean, body: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchCourses', () => {
  it('requests /api/courses for the city and returns the list', async () => {
    const list = [{ name: 'Mock Links', address: '', rating: 4, place_id: 'g1', location: null }];
    const fetchMock = reply(true, list);

    await expect(fetchCourses('Traverse City')).resolves.toEqual(list);
    expect(fetchMock).toHaveBeenCalledWith('/api/courses?city=Traverse+City');
  });

  it('rejects when the response is not ok', async () => {
    reply(false, []);
    await expect(fetchCourses('Nowhere')).rejects.toThrow('Failed to fetch courses');
  });
});
