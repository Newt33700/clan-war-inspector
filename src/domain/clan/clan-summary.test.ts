/**
 * Tests du parsing du résumé de clan (US 6.1).
 * Fonction pure, périmètre Stryker (domain/clan) : chaque repli doit être
 * verrouillé par un cas de test explicite.
 */

import { describe, expect, it } from 'vitest';
import { parseClanSummary } from './clan-summary';
import { FIXTURE_EMPTY_CLAN, FIXTURE_FULL_CLAN } from '@/mocks/fixtures';

describe('parseClanSummary', () => {
  it('extrait le resume de la fixture realiste', () => {
    expect(parseClanSummary(FIXTURE_FULL_CLAN)).toEqual({
      tag: '#20PP',
      name: 'Test Clan',
      badgeUrl: 'https://example.com/badges/medium.png',
      memberCount: 3,
      clanScore: 45000,
      warTrophies: 12000,
    });
  });

  it('extrait un clan vide sans membre', () => {
    expect(parseClanSummary(FIXTURE_EMPTY_CLAN)).toEqual({
      tag: '#20PP',
      name: 'Test Clan',
      badgeUrl: 'https://example.com/badges/medium.png',
      memberCount: 0,
      clanScore: 45000,
      warTrophies: 12000,
    });
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['tableau', []],
    ['tag manquant', { name: 'X' }],
    ['tag vide', { tag: '   ', name: 'X' }],
  ])('retourne null pour une reponse inexploitable (%s)', (_label, raw) => {
    expect(parseClanSummary(raw)).toBeNull();
  });

  it('replie le nom manquant ou vide sur le tag', () => {
    expect(parseClanSummary({ tag: '#ABC' })?.name).toBe('#ABC');
    expect(parseClanSummary({ tag: '#ABC', name: '' })?.name).toBe('#ABC');
  });

  it('choisit le badge medium, puis large, puis small, sinon vide', () => {
    expect(
      parseClanSummary({ tag: '#A', badgeUrls: { medium: 'm.png' } })?.badgeUrl,
    ).toBe('m.png');
    expect(parseClanSummary({ tag: '#A', badgeUrls: { large: 'l.png' } })?.badgeUrl).toBe(
      'l.png',
    );
    expect(parseClanSummary({ tag: '#A', badgeUrls: { small: 's.png' } })?.badgeUrl).toBe(
      's.png',
    );
    expect(parseClanSummary({ tag: '#A' })?.badgeUrl).toBe('');
    expect(parseClanSummary({ tag: '#A', badgeUrls: 'oops' })?.badgeUrl).toBe('');
    expect(parseClanSummary({ tag: '#A', badgeUrls: {} })?.badgeUrl).toBe('');
  });

  it('replie l effectif sur la taille de memberList si members est absent ou aberrant', () => {
    expect(parseClanSummary({ tag: '#A', memberList: [{}, {}] })?.memberCount).toBe(2);
    expect(
      parseClanSummary({ tag: '#A', members: -3, memberList: [{}] })?.memberCount,
    ).toBe(1);
  });

  it('retombe a 0 quand ni members ni memberList ne sont exploitables', () => {
    expect(parseClanSummary({ tag: '#A' })?.memberCount).toBe(0);
    expect(parseClanSummary({ tag: '#A', memberList: 'oops' })?.memberCount).toBe(0);
  });

  it('borne clanScore et warTrophies manquants ou aberrants a 0', () => {
    expect(
      parseClanSummary({ tag: '#A', clanScore: 'oops', clanWarTrophies: -5 }),
    ).toMatchObject({ clanScore: 0, warTrophies: 0 });
  });
});
