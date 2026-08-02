/**
 * Tests de la recherche de clan par nom (US 10.1).
 */

import { describe, expect, it } from 'vitest';
import { FIXTURE_FULL_CLAN } from '@/mocks/fixtures';
import { isSearchableClanName, parseClanSearchResults } from './clan-search';

describe('isSearchableClanName', () => {
  it('refuse une requete de moins de 3 caracteres utiles', () => {
    expect(isSearchableClanName('')).toBe(false);
    expect(isSearchableClanName('a')).toBe(false);
    expect(isSearchableClanName('ab')).toBe(false);
  });

  it('refuse une requete blanche meme si sa longueur brute atteint 3', () => {
    expect(isSearchableClanName('   ')).toBe(false);
  });

  it('accepte une requete de 3 caracteres utiles ou plus', () => {
    expect(isSearchableClanName('abc')).toBe(true);
    expect(isSearchableClanName('  abc  ')).toBe(true);
    expect(isSearchableClanName('Chevreaux Team')).toBe(true);
  });
});

describe('parseClanSearchResults', () => {
  it('extrait les candidats de la fixture realiste', () => {
    const results = parseClanSearchResults({ items: [FIXTURE_FULL_CLAN] });
    expect(results).toEqual([
      {
        tag: '#20PP',
        name: 'Test Clan',
        badgeUrl: 'https://example.com/badges/medium.png',
        memberCount: 3,
        clanScore: 45000,
        warTrophies: 12000,
      },
    ]);
  });

  it('extrait plusieurs candidats dans l ordre recu', () => {
    const results = parseClanSearchResults({
      items: [
        { tag: '#A', name: 'Clan A' },
        { tag: '#B', name: 'Clan B' },
      ],
    });
    expect(results.map((r) => r.tag)).toEqual(['#A', '#B']);
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['tableau', []],
    ['objet sans items', {}],
    ['items non tableau', { items: 'oops' }],
  ])('retourne [] pour une reponse inexploitable (%s)', (_label, raw) => {
    expect(parseClanSearchResults(raw)).toEqual([]);
  });

  it('ignore une entree sans tag exploitable sans planter', () => {
    const results = parseClanSearchResults({
      items: [{ name: 'Sans tag' }, null, 'oops', { tag: '#OK', name: 'Valide' }],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.tag).toBe('#OK');
  });

  it('retourne un tableau vide quand aucun clan ne correspond', () => {
    expect(parseClanSearchResults({ items: [] })).toEqual([]);
  });
});
