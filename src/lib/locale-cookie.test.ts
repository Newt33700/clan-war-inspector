import { describe, expect, it } from 'vitest';
import {
  buildLocaleCookieString,
  LOCALE_COOKIE_NAME,
  parseLocaleCookieValue,
} from './locale-cookie';

describe('parseLocaleCookieValue', () => {
  it('accepte une langue supportee', () => {
    expect(parseLocaleCookieValue('en')).toBe('en');
  });

  it('retourne null pour une valeur absente', () => {
    expect(parseLocaleCookieValue(undefined)).toBeNull();
    expect(parseLocaleCookieValue(null)).toBeNull();
  });

  it('retourne null pour une langue non supportee', () => {
    expect(parseLocaleCookieValue('de')).toBeNull();
  });
});

describe('buildLocaleCookieString', () => {
  it('construit la chaine de cookie avec les attributs attendus', () => {
    const cookie = buildLocaleCookieString('es');

    expect(cookie).toContain(`${LOCALE_COOKIE_NAME}=es`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toMatch(/Max-Age=\d+/);
  });
});
