import { describe, expect, it } from 'vitest';
import {
  buildClanTagCookieString,
  CLAN_TAG_COOKIE_NAME,
  parseClanTagCookieValue,
} from './clan-tag-cookie';

describe('parseClanTagCookieValue', () => {
  it('normalise un tag valide', () => {
    expect(parseClanTagCookieValue('20j20qg')).toBe('#20J20QG');
  });

  it('retourne null pour une valeur absente', () => {
    expect(parseClanTagCookieValue(undefined)).toBeNull();
    expect(parseClanTagCookieValue(null)).toBeNull();
  });

  it('retourne null pour un tag invalide', () => {
    expect(parseClanTagCookieValue('pas-un-tag!')).toBeNull();
  });
});

describe('buildClanTagCookieString', () => {
  it('encode le tag normalise avec les attributs attendus', () => {
    const cookie = buildClanTagCookieString('#20j20qg');

    expect(cookie).toContain(`${CLAN_TAG_COOKIE_NAME}=%2320J20QG`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toMatch(/Max-Age=\d+/);
  });
});
