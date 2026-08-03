import { describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: getMock }),
}));

describe('readClanTagFromCookies', () => {
  it('retourne le tag normalise quand le cookie est valide', async () => {
    getMock.mockReturnValue({ value: encodeURIComponent('#20j20qg') });
    const { readClanTagFromCookies } = await import('./clan-tag-server');

    expect(await readClanTagFromCookies()).toBe('#20J20QG');
  });

  it('retourne null quand le cookie est absent', async () => {
    getMock.mockReturnValue(undefined);
    const { readClanTagFromCookies } = await import('./clan-tag-server');

    expect(await readClanTagFromCookies()).toBeNull();
  });

  it('retourne null quand le cookie contient un tag invalide', async () => {
    getMock.mockReturnValue({ value: 'pas-un-tag' });
    const { readClanTagFromCookies } = await import('./clan-tag-server');

    expect(await readClanTagFromCookies()).toBeNull();
  });
});
