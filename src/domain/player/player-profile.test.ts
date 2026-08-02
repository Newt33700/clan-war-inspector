/**
 * Tests du parsing du profil joueur (US 9).
 * Fonction pure, perimetre Stryker (domain/) : chaque repli explicite.
 */

import { describe, expect, it } from 'vitest';
import { parsePlayerProfile } from './player-profile';
import { FIXTURE_PLAYER_PROFILE, FIXTURE_PLAYER_PROFILE_NO_DECK } from '@/mocks/fixtures';

describe('parsePlayerProfile', () => {
  it('extrait le profil complet avec un deck de 8 cartes', () => {
    const profile = parsePlayerProfile(FIXTURE_PLAYER_PROFILE);
    expect(profile).toMatchObject({
      tag: '#PLAYER1',
      name: 'Joueur 1',
      role: 'leader',
      expLevel: 13,
      donations: 500,
    });
    expect(profile?.deck).toHaveLength(8);
    expect(profile?.deck[0]).toEqual({
      name: 'Carte 1',
      iconUrl: 'https://example.com/cards/1.png',
      level: 11,
    });
  });

  it('replie sur currentFavouriteCard quand currentDeck est absent', () => {
    const profile = parsePlayerProfile(FIXTURE_PLAYER_PROFILE_NO_DECK);
    expect(profile?.deck).toEqual([
      {
        name: 'Carte Favorite',
        iconUrl: 'https://example.com/cards/favorite.png',
        level: 9,
      },
    ]);
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['tableau', []],
    ['tag manquant', { name: 'X' }],
    ['tag vide', { tag: '   ' }],
  ])('retourne null pour une reponse inexploitable (%s)', (_label, raw) => {
    expect(parsePlayerProfile(raw)).toBeNull();
  });

  it('canonicalise le tag', () => {
    expect(parsePlayerProfile({ tag: ' p1uu ' })?.tag).toBe('#P1UU');
  });

  it('replie le nom manquant ou vide sur le tag', () => {
    expect(parsePlayerProfile({ tag: '#A' })?.name).toBe('#A');
    expect(parsePlayerProfile({ tag: '#A', name: '' })?.name).toBe('#A');
  });

  it.each(['leader', 'coLeader', 'elder', 'member'] as const)(
    'conserve le role connu %s',
    (role) => {
      expect(parsePlayerProfile({ tag: '#A', role })?.role).toBe(role);
    },
  );

  it('retombe sur null pour un role inconnu ou absent (joueur hors clan)', () => {
    expect(parsePlayerProfile({ tag: '#A', role: 'admin' })?.role).toBeNull();
    expect(parsePlayerProfile({ tag: '#A' })?.role).toBeNull();
  });

  it('borne expLevel et donations manquants ou aberrants a 0', () => {
    expect(
      parsePlayerProfile({ tag: '#A', expLevel: 'oops', donations: -5 }),
    ).toMatchObject({ expLevel: 0, donations: 0 });
  });

  it('deck vide quand ni currentDeck ni currentFavouriteCard ne sont exploitables', () => {
    expect(parsePlayerProfile({ tag: '#A' })?.deck).toEqual([]);
    expect(parsePlayerProfile({ tag: '#A', currentDeck: 'oops' })?.deck).toEqual([]);
    expect(parsePlayerProfile({ tag: '#A', currentDeck: [] })?.deck).toEqual([]);
  });

  it('ignore une carte du deck non exploitable sans planter', () => {
    const profile = parsePlayerProfile({
      tag: '#A',
      currentDeck: ['oops', null, { name: 'Valide', id: 1, level: 5, maxLevel: 14 }],
    });
    expect(profile?.deck).toEqual([{ name: 'Valide', iconUrl: '', level: 5 }]);
  });

  it('borne le niveau d une carte manquant a 0 et l icone a vide', () => {
    const profile = parsePlayerProfile({
      tag: '#A',
      currentDeck: [{ name: 'Sans niveau' }],
    });
    expect(profile?.deck).toEqual([{ name: 'Sans niveau', iconUrl: '', level: 0 }]);
  });

  it('remplace un nom de carte manquant par une chaine vide', () => {
    const profile = parsePlayerProfile({ tag: '#A', currentDeck: [{ level: 5 }] });
    expect(profile?.deck).toEqual([{ name: '', iconUrl: '', level: 5 }]);
  });
});
