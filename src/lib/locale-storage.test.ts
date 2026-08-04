/**
 * Tests de la persistance de la langue (localStorage + cookie), sur le
 * meme modele que `clan-tag-storage.test.ts`.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredLocale, storeLocale } from './locale-storage';

function clearCookies() {
  document.cookie = 'cwi_locale=; Path=/; Max-Age=0';
}

describe('locale-storage', () => {
  afterEach(() => {
    window.localStorage.clear();
    clearCookies();
    vi.restoreAllMocks();
  });

  it('memorise puis relit une langue valide', () => {
    storeLocale('it');

    expect(readStoredLocale()).toBe('it');
    expect(document.cookie).toContain('cwi_locale=it');
  });

  it('n a rien memorise par defaut', () => {
    expect(readStoredLocale()).toBeNull();
  });

  it('retourne null si la valeur stockee n est pas une langue supportee', () => {
    window.localStorage.setItem('clan-war-inspector:locale', 'klingon');

    expect(readStoredLocale()).toBeNull();
  });

  it('reste tolerant si le localStorage est indisponible en ecriture', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota depasse');
    });

    expect(() => storeLocale('en')).not.toThrow();
    spy.mockRestore();
  });

  it('reste tolerant si le localStorage est indisponible en lecture', () => {
    const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('navigation privee');
    });

    expect(readStoredLocale()).toBeNull();
    spy.mockRestore();
  });

  it('reste tolerant si document.cookie est indisponible', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      set() {
        throw new Error('cookies desactives');
      },
      get() {
        return '';
      },
    });

    try {
      expect(() => storeLocale('en')).not.toThrow();
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie;
    }
  });
});
