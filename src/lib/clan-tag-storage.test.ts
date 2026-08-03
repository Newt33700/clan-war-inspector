/**
 * Tests de la persistance du tag de clan (localStorage + cookie, US 13.1).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readClanTagCookie, readStoredClanTag, storeClanTag } from './clan-tag-storage';

function clearCookies() {
  document.cookie = 'cwi_clan_tag=; Path=/; Max-Age=0';
}

describe('clan-tag-storage', () => {
  afterEach(() => {
    window.localStorage.clear();
    clearCookies();
    vi.restoreAllMocks();
  });

  it('memorise puis relit un tag valide, normalise', () => {
    storeClanTag('20j20qg');

    expect(readStoredClanTag()).toBe('#20J20QG');
    expect(readClanTagCookie()).toBe('#20J20QG');
  });

  it('n a rien memorise par defaut', () => {
    expect(readStoredClanTag()).toBeNull();
    expect(readClanTagCookie()).toBeNull();
  });

  it('reste tolerant si le localStorage est indisponible', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota depasse');
    });

    expect(() => storeClanTag('#20J20QG')).not.toThrow();
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
      expect(() => storeClanTag('#20J20QG')).not.toThrow();
    } finally {
      // Retire la propriete d'instance posee ci-dessus : l'accesseur du
      // prototype jsdom redevient visible pour les tests suivants.
      delete (document as unknown as Record<string, unknown>).cookie;
    }
  });
});
