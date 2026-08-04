/**
 * Tests de la memoire de clans recents (retour utilisateur du 2026-08-04,
 * limite a 10 clans, cle sur le tag pour tolerer les doublons de nom).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_RECENT_CLANS,
  readRecentClans,
  rememberRecentClan,
} from './recent-clans-storage';

describe('recent-clans-storage', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('n a rien memorise par defaut', () => {
    expect(readRecentClans()).toEqual([]);
  });

  it('memorise un clan avec son nom', () => {
    rememberRecentClan('#20j20qg', 'Chevreaux Team');

    expect(readRecentClans()).toEqual([{ tag: '#20J20QG', name: 'Chevreaux Team' }]);
  });

  it('retombe sur le tag comme nom si aucun nom n est fourni', () => {
    rememberRecentClan('#20j20qg');

    expect(readRecentClans()).toEqual([{ tag: '#20J20QG', name: '#20J20QG' }]);
  });

  it('ignore un tag invalide', () => {
    rememberRecentClan('pas-un-tag!', 'Nom');

    expect(readRecentClans()).toEqual([]);
  });

  it('remonte un clan deja connu en tete plutot que de le dupliquer', () => {
    rememberRecentClan('#PPPP', 'Alpha');
    rememberRecentClan('#YYYY', 'Bravo');
    rememberRecentClan('#PPPP', 'Alpha Renomme');

    expect(readRecentClans()).toEqual([
      { tag: '#PPPP', name: 'Alpha Renomme' },
      { tag: '#YYYY', name: 'Bravo' },
    ]);
  });

  it(`plafonne a ${MAX_RECENT_CLANS} clans, en retirant le plus ancien`, () => {
    // Alphabet officiel des tags (`0289PYLQGRJCUV`, cf. `domain/clan/clan-tag.ts`) :
    // un tag par lettre suffit a generer 12 tags distincts et valides.
    const ALPHABET = '0289PYLQGRJCUV';
    for (let index = 0; index < MAX_RECENT_CLANS + 2; index += 1) {
      rememberRecentClan(`#PP${ALPHABET[index]}`, `Clan ${index}`);
    }

    const stored = readRecentClans();
    expect(stored).toHaveLength(MAX_RECENT_CLANS);
    expect(stored[0]?.name).toBe(`Clan ${MAX_RECENT_CLANS + 1}`);
    expect(stored.find((clan) => clan.name === 'Clan 0')).toBeUndefined();
  });

  it('ignore une entree malformee lue depuis le stockage', () => {
    window.localStorage.setItem(
      'clan-war-inspector:recent-clans',
      JSON.stringify([{ tag: '#PPPP' }, 'pas-un-objet', { tag: 'invalide', name: 'x' }]),
    );

    expect(readRecentClans()).toEqual([]);
  });

  it('retourne [] si le stockage ne contient pas un tableau', () => {
    window.localStorage.setItem('clan-war-inspector:recent-clans', JSON.stringify({}));

    expect(readRecentClans()).toEqual([]);
  });

  it('retourne [] si le contenu stocke n est pas du JSON valide', () => {
    window.localStorage.setItem('clan-war-inspector:recent-clans', 'pas du json');

    expect(readRecentClans()).toEqual([]);
  });

  it('reste tolerant si le localStorage est indisponible', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota depasse');
    });

    expect(() => rememberRecentClan('#AAAA', 'Alpha')).not.toThrow();
    spy.mockRestore();
  });
});
