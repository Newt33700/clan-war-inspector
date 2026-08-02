/**
 * Tests du moteur d'historique de guerre (US 4.2).
 *
 * Couverture 100 % exigee : chaque cas limite du backlog est materialise
 * ici (joueur arrive en cours de semaine, joueur parti, semaine incomplete,
 * log vide, valeurs manquantes ou aberrantes, doublons de tag).
 */

import { describe, expect, it } from 'vitest';
import { InvalidClanTagError } from '../clan/clan-tag';
import {
  BATTLES_PER_WAR_WEEK,
  buildClanWarHistory,
  clampBattleCount,
  computeAttendance,
  filterCurrentMembers,
  formatWarWeekPeriod,
  parseRiverRaceLog,
  sortPlayerAttendance,
  type PlayerAttendance,
  type WarWeek,
} from './war-history';
import { FIXTURE_RIVER_RACE_LOG } from '@/mocks/fixtures';

/** Raccourci : une entree de log realiste pour le clan #20PP. */
function logWeek(
  participants: unknown[],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    seasonId: 107,
    sectionIndex: 3,
    createdDate: '20260727T093602.000Z',
    standings: [
      {
        rank: 1,
        trophyChange: 200,
        clan: { tag: '#20PP', name: 'Test Clan', participants },
      },
    ],
    ...overrides,
  };
}

function week(
  participants: { tag: string; name: string; battlesPlayed: number }[],
): WarWeek {
  return {
    weekId: `w${Math.random()}`,
    seasonId: null,
    sectionIndex: null,
    createdDate: null,
    participants,
  };
}

describe('BATTLES_PER_WAR_WEEK', () => {
  it('vaut 16 : 4 decks par jour sur 4 jours de bataille', () => {
    expect(BATTLES_PER_WAR_WEEK).toBe(16);
  });
});

describe('clampBattleCount', () => {
  it('conserve un decompte valide', () => {
    expect(clampBattleCount(12)).toBe(12);
  });

  it('conserve la borne basse 0', () => {
    expect(clampBattleCount(0)).toBe(0);
  });

  it('conserve la borne haute 16', () => {
    expect(clampBattleCount(16)).toBe(16);
  });

  it('ecrete une valeur aberrante superieure a 16', () => {
    expect(clampBattleCount(17)).toBe(16);
    expect(clampBattleCount(999)).toBe(16);
    expect(clampBattleCount(Number.POSITIVE_INFINITY)).toBe(16);
  });

  it('remonte une valeur negative a 0', () => {
    expect(clampBattleCount(-1)).toBe(0);
    expect(clampBattleCount(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('tronque une valeur fractionnaire', () => {
    expect(clampBattleCount(15.9)).toBe(15);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['NaN', Number.NaN],
    ['chaine', '12'],
    ['objet', {}],
  ])('retombe a 0 pour une valeur inutilisable (%s)', (_label, value) => {
    expect(clampBattleCount(value)).toBe(0);
  });
});

describe('parseRiverRaceLog', () => {
  it('leve InvalidClanTagError pour un tag cible invalide', () => {
    expect(() => parseRiverRaceLog({ items: [] }, '#2PZ')).toThrow(InvalidClanTagError);
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['chaine', 'garbage'],
    ['objet sans items', {}],
    ['items non tableau', { items: 'oops' }],
  ])('retourne [] pour un log inexploitable (%s)', (_label, raw) => {
    expect(parseRiverRaceLog(raw, '#20PP')).toEqual([]);
  });

  it('accepte la forme officielle { items: [...] }', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '#P1', name: 'A', decksUsed: 7 }])] },
      '#20PP',
    );
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.participants).toEqual([{ tag: '#P1', name: 'A', battlesPlayed: 7 }]);
  });

  it('accepte un tableau direct d entrees', () => {
    const weeks = parseRiverRaceLog(
      [logWeek([{ tag: '#P1', name: 'A', decksUsed: 7 }])],
      '#20PP',
    );
    expect(weeks).toHaveLength(1);
  });

  it('conserve l ordre des semaines (plus recente en premier)', () => {
    const weeks = parseRiverRaceLog(FIXTURE_RIVER_RACE_LOG, '#20PP');
    expect(weeks.map((w) => w.weekId)).toEqual(['s107-w3', 's107-w2']);
  });

  it('extrait les metadonnees de semaine', () => {
    const weeks = parseRiverRaceLog(FIXTURE_RIVER_RACE_LOG, '#20PP');
    expect(weeks[0]).toMatchObject({
      weekId: 's107-w3',
      seasonId: 107,
      sectionIndex: 3,
      createdDate: '20260727T093602.000Z',
    });
  });

  it('ne retient que le standing du clan cible, pas celui des rivaux', () => {
    const weeks = parseRiverRaceLog(FIXTURE_RIVER_RACE_LOG, '#20PP');
    const tags = weeks[0]?.participants.map((p) => p.tag);
    expect(tags).toContain('#PLAYER1');
    expect(tags).not.toContain('#ENEMY1');
  });

  it('matche le clan avec un tag non canonique (casse, espaces, O/0)', () => {
    const weeks = parseRiverRaceLog(FIXTURE_RIVER_RACE_LOG, '  2opp ');
    expect(weeks).toHaveLength(2);
  });

  it('matche un tag de clan non canonique dans le log lui-meme', () => {
    const item = logWeek([{ tag: '#P1', name: 'A', decksUsed: 4 }]);
    (item.standings as { clan: { tag: string } }[])[0]!.clan.tag = ' 2opp ';
    expect(parseRiverRaceLog({ items: [item] }, '#20PP')).toHaveLength(1);
  });

  it('ignore une semaine ou le clan cible est absent', () => {
    const foreign = logWeek([]);
    (foreign.standings as { clan: { tag: string } }[])[0]!.clan.tag = '#RIVAL';
    expect(parseRiverRaceLog({ items: [foreign] }, '#20PP')).toEqual([]);
  });

  it.each([
    ['entree non objet', 'garbage'],
    ['entree null', null],
    ['standings manquant', { seasonId: 1 }],
    ['standings non tableau', { standings: 'oops' }],
    ['standing non objet', { standings: ['oops'] }],
    ['standing null', { standings: [null] }],
    ['standing sans clan', { standings: [{ rank: 1 }] }],
    ['clan sans tag valide', { standings: [{ clan: { tag: '!!' } }] }],
    ['clan avec tag non string', { standings: [{ clan: { tag: 42 } }] }],
  ])('ignore une semaine malformee (%s)', (_label, entry) => {
    expect(parseRiverRaceLog({ items: [entry] }, '#20PP')).toEqual([]);
  });

  it('lit les participants sous standing.participants en secours', () => {
    const weeks = parseRiverRaceLog(
      {
        items: [
          {
            standings: [
              {
                clan: { tag: '#20PP', name: 'Test Clan' },
                participants: [{ tag: '#P1', name: 'A', decksUsed: 6 }],
              },
            ],
          },
        ],
      },
      '#20PP',
    );
    expect(weeks[0]?.participants).toEqual([{ tag: '#P1', name: 'A', battlesPlayed: 6 }]);
  });

  it('retourne une semaine sans participants quand la liste est absente', () => {
    const weeks = parseRiverRaceLog(
      { items: [{ standings: [{ clan: { tag: '#20PP' } }] }] },
      '#20PP',
    );
    expect(weeks[0]?.participants).toEqual([]);
  });

  it('prefere decksUsed a wins quand les deux existent', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '#P1', name: 'A', decksUsed: 5, wins: 9 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.battlesPlayed).toBe(5);
  });

  it('retombe sur wins quand decksUsed est absent', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '#P1', name: 'A', wins: 9 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.battlesPlayed).toBe(9);
  });

  it('compte 0 combat quand toute donnee de decompte manque', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '#P1', name: 'A' }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.battlesPlayed).toBe(0);
  });

  it('ecrete une valeur aberrante superieure a 16', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '#P1', name: 'A', decksUsed: 42 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.battlesPlayed).toBe(16);
  });

  it('canonicalise les tags joueurs (casse, diese) sans les valider', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: 'p1uu', name: 'A', decksUsed: 3 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.tag).toBe('#P1UU');
  });

  it('supprime espaces et dieses multiples des tags joueurs', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '  ##P1  ', name: 'A', decksUsed: 3 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.tag).toBe('#P1');
  });

  it('ne supprime que les dieses de tete, pas ceux du milieu', () => {
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: 'P#1', name: 'A', decksUsed: 3 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants[0]?.tag).toBe('#P#1');
  });

  it('ne rejette pas un tag joueur hors alphabet clan (donnee machine)', () => {
    // Contrairement au tag de clan (saisie humaine), un participant n'est
    // jamais perdu a cause d'un tag exotique : le decompte prime.
    const weeks = parseRiverRaceLog(
      { items: [logWeek([{ tag: '#PLAYER1', name: 'A', decksUsed: 3 }])] },
      '#20PP',
    );
    expect(weeks[0]?.participants).toHaveLength(1);
  });

  it.each([
    ['participant non objet', 'oops'],
    ['participant null', null],
    ['tag manquant', { name: 'A', decksUsed: 4 }],
    ['tag non string', { tag: 42, decksUsed: 4 }],
    ['tag vide', { tag: '   ', decksUsed: 4 }],
    ['diese seul', { tag: '#', decksUsed: 4 }],
  ])('ignore un participant inutilisable (%s)', (_label, participant) => {
    const weeks = parseRiverRaceLog({ items: [logWeek([participant])] }, '#20PP');
    expect(weeks[0]?.participants).toEqual([]);
  });

  it('remplace un nom manquant ou vide par le tag', () => {
    const weeks = parseRiverRaceLog(
      {
        items: [
          logWeek([
            { tag: '#P1', decksUsed: 4 },
            { tag: '#P2UU', name: '', decksUsed: 4 },
          ]),
        ],
      },
      '#20PP',
    );
    expect(weeks[0]?.participants.map((p) => p.name)).toEqual(['#P1', '#P2UU']);
  });

  it('fusionne les doublons de tag en gardant le decompte le plus eleve', () => {
    const weeks = parseRiverRaceLog(
      {
        items: [
          logWeek([
            { tag: '#P1', name: 'A', decksUsed: 4 },
            { tag: '#P1', name: 'A', decksUsed: 9 },
          ]),
        ],
      },
      '#20PP',
    );
    expect(weeks[0]?.participants).toEqual([{ tag: '#P1', name: 'A', battlesPlayed: 9 }]);
  });

  it('fusionne aussi quand le doublon le plus eleve arrive en premier', () => {
    const weeks = parseRiverRaceLog(
      {
        items: [
          logWeek([
            { tag: '#P1', name: 'A', decksUsed: 9 },
            { tag: '#P1', name: 'A', decksUsed: 4 },
          ]),
        ],
      },
      '#20PP',
    );
    expect(weeks[0]?.participants).toEqual([{ tag: '#P1', name: 'A', battlesPlayed: 9 }]);
  });

  describe('weekId', () => {
    it('combine saison et section quand disponibles', () => {
      const weeks = parseRiverRaceLog(
        { items: [logWeek([], { seasonId: 99, sectionIndex: 1 })] },
        '#20PP',
      );
      expect(weeks[0]?.weekId).toBe('s99-w1');
    });

    it('retombe sur createdDate quand la section manque', () => {
      const weeks = parseRiverRaceLog(
        {
          items: [logWeek([], { sectionIndex: undefined, seasonId: undefined })],
        },
        '#20PP',
      );
      expect(weeks[0]?.weekId).toBe('20260727T093602.000Z');
      expect(weeks[0]?.seasonId).toBeNull();
      expect(weeks[0]?.sectionIndex).toBeNull();
    });

    it('retombe sur l index quand tout manque', () => {
      const weeks = parseRiverRaceLog(
        {
          items: [
            logWeek([], {
              seasonId: undefined,
              sectionIndex: undefined,
              createdDate: undefined,
            }),
          ],
        },
        '#20PP',
      );
      expect(weeks[0]?.weekId).toBe('week-0');
      expect(weeks[0]?.createdDate).toBeNull();
    });

    it('n utilise pas le format saison-section quand seule la saison existe', () => {
      const weeks = parseRiverRaceLog(
        { items: [logWeek([], { sectionIndex: undefined })] },
        '#20PP',
      );
      expect(weeks[0]?.weekId).toBe('20260727T093602.000Z');
    });

    it('n utilise pas le format saison-section quand seule la section existe', () => {
      const weeks = parseRiverRaceLog(
        { items: [logWeek([], { seasonId: 'oops' })] },
        '#20PP',
      );
      expect(weeks[0]?.weekId).toBe('20260727T093602.000Z');
    });
  });
});

describe('computeAttendance', () => {
  it('retourne [] sans semaine', () => {
    expect(computeAttendance([])).toEqual([]);
  });

  it('cumule les combats d un joueur present toutes les semaines', () => {
    const players = computeAttendance([
      week([{ tag: '#P1', name: 'A', battlesPlayed: 16 }]),
      week([{ tag: '#P1', name: 'A', battlesPlayed: 4 }]),
    ]);
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({
      tag: '#P1',
      battlesByWeek: [16, 4],
      totalBattles: 20,
      weeksPresent: 2,
      averagePerPresentWeek: 10,
    });
  });

  it('marque null les semaines ou le joueur est absent (arrivee en cours)', () => {
    const players = computeAttendance([
      week([{ tag: '#NEW', name: 'Nouveau', battlesPlayed: 8 }]),
      week([]),
    ]);
    expect(players[0]?.battlesByWeek).toEqual([8, null]);
    expect(players[0]?.weeksPresent).toBe(1);
    expect(players[0]?.averagePerPresentWeek).toBe(8);
  });

  it('conserve l historique d un joueur parti (present seulement avant)', () => {
    const players = computeAttendance([
      week([]),
      week([{ tag: '#OLD', name: 'Ancien', battlesPlayed: 3 }]),
    ]);
    expect(players[0]?.battlesByWeek).toEqual([null, 3]);
  });

  it('distingue 0 combat (present) de null (absent)', () => {
    const players = computeAttendance([
      week([{ tag: '#P1', name: 'A', battlesPlayed: 0 }]),
      week([]),
    ]);
    expect(players[0]?.battlesByWeek).toEqual([0, null]);
    expect(players[0]?.weeksPresent).toBe(1);
    expect(players[0]?.totalBattles).toBe(0);
    expect(players[0]?.averagePerPresentWeek).toBe(0);
  });

  it('garde le nom le plus recent quand un joueur a ete renomme', () => {
    const players = computeAttendance([
      week([{ tag: '#P1', name: 'NomRecent', battlesPlayed: 1 }]),
      week([{ tag: '#P1', name: 'VieuxNom', battlesPlayed: 1 }]),
    ]);
    expect(players[0]?.name).toBe('NomRecent');
  });

  it('trie par nom puis par tag (tie-break stable)', () => {
    const players = computeAttendance([
      week([
        { tag: '#ZZZ', name: 'Alice', battlesPlayed: 1 },
        { tag: '#AAA', name: 'Bob', battlesPlayed: 1 },
        { tag: '#BBB', name: 'Alice', battlesPlayed: 1 },
      ]),
    ]);
    expect(players.map((p) => p.tag)).toEqual(['#BBB', '#ZZZ', '#AAA']);
  });
});

describe('buildClanWarHistory', () => {
  it('enchaine parsing et pivot sur la fixture realiste', () => {
    const history = buildClanWarHistory(FIXTURE_RIVER_RACE_LOG, '#20PP');

    expect(history.weeks.map((w) => w.weekId)).toEqual(['s107-w3', 's107-w2']);
    expect(history.players.map((p) => p.tag)).toEqual([
      '#PLAYER5',
      '#PLAYER1',
      '#PLAYER2',
      '#PLAYER3',
      '#PLAYER4',
    ]);

    const p1 = history.players.find((p) => p.tag === '#PLAYER1');
    expect(p1).toMatchObject({
      battlesByWeek: [16, 16],
      totalBattles: 32,
      weeksPresent: 2,
      averagePerPresentWeek: 16,
    });

    // Arrive en cours de route : absent de la semaine la plus ancienne.
    const p4 = history.players.find((p) => p.tag === '#PLAYER4');
    expect(p4?.battlesByWeek).toEqual([0, null]);

    // Parti du clan : absent de la semaine la plus recente.
    const p5 = history.players.find((p) => p.tag === '#PLAYER5');
    expect(p5?.battlesByWeek).toEqual([null, 3]);
  });
});

describe('filterCurrentMembers', () => {
  it('ne conserve que les joueurs presents dans les tags actuels', () => {
    const players = [
      attendance({ tag: '#A' }),
      attendance({ tag: '#B' }),
      attendance({ tag: '#C' }),
    ];
    expect(filterCurrentMembers(players, ['#A', '#C']).map((p) => p.tag)).toEqual([
      '#A',
      '#C',
    ]);
  });

  it('retourne un tableau vide si aucun joueur n est encore membre', () => {
    expect(filterCurrentMembers([attendance({ tag: '#A' })], [])).toEqual([]);
  });
});

function attendance(overrides: Partial<PlayerAttendance>): PlayerAttendance {
  return {
    tag: '#TAG',
    name: 'Nom',
    battlesByWeek: [],
    totalBattles: 0,
    weeksPresent: 1,
    averagePerPresentWeek: 0,
    ...overrides,
  };
}

describe('sortPlayerAttendance (US 6.7)', () => {
  const alice = attendance({
    tag: '#A',
    name: 'Alice',
    totalBattles: 20,
    averagePerPresentWeek: 10,
  });
  const bob = attendance({
    tag: '#B',
    name: 'Bob',
    totalBattles: 30,
    averagePerPresentWeek: 15,
  });
  const carol = attendance({
    tag: '#C',
    name: 'Carol',
    totalBattles: 10,
    averagePerPresentWeek: 5,
  });

  it('ne mute pas le tableau d entree', () => {
    const input = [bob, alice];
    sortPlayerAttendance(input, 'total', 'asc');
    expect(input).toEqual([bob, alice]);
  });

  it('trie par total ascendant', () => {
    expect(
      sortPlayerAttendance([bob, alice, carol], 'total', 'asc').map((p) => p.tag),
    ).toEqual(['#C', '#A', '#B']);
  });

  it('trie par total descendant', () => {
    expect(
      sortPlayerAttendance([carol, alice, bob], 'total', 'desc').map((p) => p.tag),
    ).toEqual(['#B', '#A', '#C']);
  });

  it('trie par moyenne ascendante', () => {
    expect(
      sortPlayerAttendance([bob, alice, carol], 'average', 'asc').map((p) => p.tag),
    ).toEqual(['#C', '#A', '#B']);
  });

  it('trie par moyenne descendante', () => {
    expect(
      sortPlayerAttendance([carol, alice, bob], 'average', 'desc').map((p) => p.tag),
    ).toEqual(['#B', '#A', '#C']);
  });

  it('departage les ex-aequo par nom puis tag ascendant', () => {
    const tieA = attendance({ tag: '#Z', name: 'Zoe', totalBattles: 10 });
    const tieB = attendance({ tag: '#Y', name: 'Anna', totalBattles: 10 });
    expect(
      sortPlayerAttendance([tieA, tieB], 'total', 'desc').map((p) => p.name),
    ).toEqual(['Anna', 'Zoe']);
  });

  it('departage les homonymes par tag ascendant', () => {
    const twinB = attendance({ tag: '#ZZ', name: 'Jumeau', totalBattles: 10 });
    const twinA = attendance({ tag: '#AA', name: 'Jumeau', totalBattles: 10 });
    expect(
      sortPlayerAttendance([twinB, twinA], 'total', 'asc').map((p) => p.tag),
    ).toEqual(['#AA', '#ZZ']);
  });
});

describe('formatWarWeekPeriod (US 6.7)', () => {
  it('formate une date Supercell compacte en date lisible', () => {
    expect(formatWarWeekPeriod('20260727T093602.000Z')).toBe('27/07/2026');
  });

  it('retourne null si la date est absente', () => {
    expect(formatWarWeekPeriod(null)).toBeNull();
  });

  it('retourne null si la date est illisible', () => {
    expect(formatWarWeekPeriod('pas-une-date')).toBeNull();
  });
});
