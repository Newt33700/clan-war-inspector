/**
 * Tests du "Hall of Fame" (US 8) : top 3 par fame sur la derniere semaine
 * complete du clan cible. Logique pure, perimetre Stryker.
 */

import { describe, expect, it } from 'vitest';
import { InvalidClanTagError } from './clan-tag';
import { findWeeklyTopFame } from './hall-of-fame';
import { FIXTURE_RIVER_RACE_LOG } from '@/mocks/fixtures';

function logWeek(
  participants: unknown[],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    seasonId: 107,
    sectionIndex: 3,
    createdDate: '20260727T093602.000Z',
    standings: [{ rank: 1, clan: { tag: '#20PP', name: 'Test Clan', participants } }],
    ...overrides,
  };
}

describe('findWeeklyTopFame', () => {
  it('extrait le top 3 par fame decroissante de la fixture realiste', () => {
    const top = findWeeklyTopFame(FIXTURE_RIVER_RACE_LOG, '#20PP');
    // Semaine la plus recente (sectionIndex 3) : P1=3200, P2=2100, P3=800, P4=0.
    expect(top.map((entry) => entry.tag)).toEqual(['#PLAYER1', '#PLAYER2', '#PLAYER3']);
    expect(top[0]).toEqual({ tag: '#PLAYER1', name: 'Joueur 1', fame: 3200 });
  });

  it('leve InvalidClanTagError pour un tag cible invalide', () => {
    expect(() => findWeeklyTopFame({ items: [] }, '#2PZ')).toThrow(InvalidClanTagError);
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['chaine', 'garbage'],
    ['objet sans items', {}],
  ])('retourne [] pour un log inexploitable (%s)', (_label, raw) => {
    expect(findWeeklyTopFame(raw, '#20PP')).toEqual([]);
  });

  it('retourne [] si le clan cible n apparait dans aucune semaine du log', () => {
    const foreign = logWeek([]);
    (foreign.standings as { clan: { tag: string } }[])[0]!.clan.tag = '#RIVAL';
    expect(findWeeklyTopFame({ items: [foreign] }, '#20PP')).toEqual([]);
  });

  it('ignore le clan rival dans la meme semaine', () => {
    const top = findWeeklyTopFame(FIXTURE_RIVER_RACE_LOG, '#20PP');
    expect(top.map((entry) => entry.tag)).not.toContain('#ENEMY1');
  });

  it('s arrete a la premiere semaine ou le clan cible apparait (la plus recente)', () => {
    // #PLAYER5 n'existe que dans la semaine la plus ancienne (sectionIndex 2).
    const top = findWeeklyTopFame(FIXTURE_RIVER_RACE_LOG, '#20PP');
    expect(top.map((entry) => entry.tag)).not.toContain('#PLAYER5');
  });

  it('matche un tag de clan cible non canonique (casse, espaces, O/0)', () => {
    const top = findWeeklyTopFame(FIXTURE_RIVER_RACE_LOG, '  2opp ');
    expect(top).toHaveLength(3);
  });

  it('limite au top N demande (topN personnalise)', () => {
    const top = findWeeklyTopFame(FIXTURE_RIVER_RACE_LOG, '#20PP', 1);
    expect(top).toEqual([{ tag: '#PLAYER1', name: 'Joueur 1', fame: 3200 }]);
  });

  it('ignore un participant non exploitable (sans tag) sans planter', () => {
    const raw = { items: [logWeek(['oops', null, { tag: '#P1', fame: 10 }])] };
    expect(findWeeklyTopFame(raw, '#20PP')).toEqual([
      { tag: '#P1', name: '#P1', fame: 10 },
    ]);
  });

  it('borne une fame manquante ou aberrante a 0', () => {
    const raw = {
      items: [
        logWeek([
          { tag: '#P1', fame: 'oops' },
          { tag: '#P2', fame: -5 },
        ]),
      ],
    };
    const top = findWeeklyTopFame(raw, '#20PP');
    expect(top.every((entry) => entry.fame === 0)).toBe(true);
  });

  it('fusionne un doublon de tag en gardant la fame la plus elevee', () => {
    const raw = {
      items: [
        logWeek([
          { tag: '#P1', fame: 100 },
          { tag: ' p1 ', fame: 300 },
        ]),
      ],
    };
    const top = findWeeklyTopFame(raw, '#20PP');
    expect(top).toEqual([{ tag: '#P1', name: '#P1', fame: 300 }]);
  });

  it('remplace un nom manquant ou vide par le tag', () => {
    const raw = { items: [logWeek([{ tag: '#P1', fame: 10, name: '' }])] };
    expect(findWeeklyTopFame(raw, '#20PP')[0]?.name).toBe('#P1');
  });

  it('accepte un tableau direct d entrees (sans enveloppe items)', () => {
    const top = findWeeklyTopFame([logWeek([{ tag: '#P1', fame: 10 }])], '#20PP');
    expect(top).toEqual([{ tag: '#P1', name: '#P1', fame: 10 }]);
  });

  it('ignore une entree de log non exploitable (non objet)', () => {
    const raw = { items: ['garbage', logWeek([{ tag: '#P1', fame: 10 }])] };
    expect(findWeeklyTopFame(raw, '#20PP')).toEqual([
      { tag: '#P1', name: '#P1', fame: 10 },
    ]);
  });

  it('ignore une entree de standings non exploitable (non objet)', () => {
    const week = logWeek([{ tag: '#P1', fame: 10 }]);
    (week.standings as unknown[]).unshift('garbage');
    expect(findWeeklyTopFame({ items: [week] }, '#20PP')).toEqual([
      { tag: '#P1', name: '#P1', fame: 10 },
    ]);
  });

  it('ignore un participant sans tag exploitable', () => {
    const raw = { items: [logWeek([{ name: 'Sans tag', fame: 10 }])] };
    expect(findWeeklyTopFame(raw, '#20PP')).toEqual([]);
  });

  it('ignore un standing dont le tag de clan n est pas canonicalisable', () => {
    const bad = logWeek([{ tag: '#P1', fame: 10 }]);
    (bad.standings as { clan: { tag: string } }[])[0]!.clan.tag = '!!';
    expect(findWeeklyTopFame({ items: [bad] }, '#20PP')).toEqual([]);
  });

  it('retourne [] si les participants du clan cible sont inexploitables', () => {
    const bad = logWeek('oops' as unknown as unknown[]);
    expect(findWeeklyTopFame({ items: [bad] }, '#20PP')).toEqual([]);
  });

  it('departage une fame egale par nom puis tag', () => {
    const raw = {
      items: [
        logWeek([
          { tag: '#Z', fame: 100, name: 'Zoe' },
          { tag: '#Y', fame: 100, name: 'Anna' },
        ]),
      ],
    };
    expect(findWeeklyTopFame(raw, '#20PP').map((e) => e.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage une fame et un nom egaux par le tag', () => {
    const raw = {
      items: [
        logWeek([
          { tag: '#ZZ', fame: 100, name: 'Jumeau' },
          { tag: '#AA', fame: 100, name: 'Jumeau' },
        ]),
      ],
    };
    expect(findWeeklyTopFame(raw, '#20PP').map((e) => e.tag)).toEqual(['#AA', '#ZZ']);
  });

  it('ignore une semaine dont standings est absent ou non tableau', () => {
    const week = logWeek([{ tag: '#P1', fame: 10 }]);
    delete (week as { standings?: unknown }).standings;
    const raw = { items: [week, logWeek([{ tag: '#P2', fame: 20 }])] };
    expect(findWeeklyTopFame(raw, '#20PP')).toEqual([
      { tag: '#P2', name: '#P2', fame: 20 },
    ]);
  });
});
