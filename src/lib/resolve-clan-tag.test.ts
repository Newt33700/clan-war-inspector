import { describe, expect, it, vi } from 'vitest';

const readClanTagFromCookiesMock = vi.fn();
vi.mock('./clan-tag-server', () => ({
  readClanTagFromCookies: () => readClanTagFromCookiesMock(),
}));

import { resolveActiveClanTag } from './resolve-clan-tag';

describe('resolveActiveClanTag', () => {
  it('priorise le tag de l URL sur le cookie', async () => {
    readClanTagFromCookiesMock.mockResolvedValue('#COOKIE');

    expect(await resolveActiveClanTag({ clan: '20j20qg' })).toBe('#20J20QG');
  });

  it('retombe sur le cookie quand l URL n a pas de tag valide', async () => {
    readClanTagFromCookiesMock.mockResolvedValue('#20J20QG');

    expect(await resolveActiveClanTag({})).toBe('#20J20QG');
    expect(await resolveActiveClanTag({ clan: 'pas-un-tag' })).toBe('#20J20QG');
  });

  it('retourne null si ni URL ni cookie ne fournissent de tag', async () => {
    readClanTagFromCookiesMock.mockResolvedValue(null);

    expect(await resolveActiveClanTag({})).toBeNull();
  });

  it('prend le premier element si le parametre est un tableau', async () => {
    readClanTagFromCookiesMock.mockResolvedValue(null);

    expect(await resolveActiveClanTag({ clan: ['20j20qg', '2pp'] })).toBe('#20J20QG');
  });
});
