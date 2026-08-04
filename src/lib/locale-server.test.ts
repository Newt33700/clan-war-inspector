import { describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: getMock }),
}));

describe('readLocaleFromCookies', () => {
  it('retourne la langue quand le cookie est valide', async () => {
    getMock.mockReturnValue({ value: 'it' });
    const { readLocaleFromCookies } = await import('./locale-server');

    expect(await readLocaleFromCookies()).toBe('it');
  });

  it('retourne null quand le cookie est absent', async () => {
    getMock.mockReturnValue(undefined);
    const { readLocaleFromCookies } = await import('./locale-server');

    expect(await readLocaleFromCookies()).toBeNull();
  });

  it('retourne null quand le cookie contient une langue non supportee', async () => {
    getMock.mockReturnValue({ value: 'de' });
    const { readLocaleFromCookies } = await import('./locale-server');

    expect(await readLocaleFromCookies()).toBeNull();
  });
});
