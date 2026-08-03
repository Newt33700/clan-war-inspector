/**
 * Tests de l'assistant RH (US 7) : filtres "meritants" et "sur la sellette".
 * Logique pure, perimetre Stryker : chaque borne et chaque critere
 * manquant sont verrouilles par un cas explicite.
 */

import { describe, expect, it } from 'vitest';
import { findMeritoriousMembers, findWatchlistMembers } from './hr-assistant';
import type { ClanMember } from './members';
import type { PlayerAttendance } from '../war/war-history';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    trophies: 5000,
    donations: 5,
    ...overrides,
  };
}

function attendance(tag: string, battlesByWeek: (number | null)[]): PlayerAttendance {
  const present = battlesByWeek.filter((b) => b !== null) as number[];
  return {
    tag,
    name: tag,
    battlesByWeek,
    totalBattles: present.reduce((sum, b) => sum + b, 0),
    weeksPresent: present.length,
    averagePerPresentWeek: present.length === 0 ? 0 : present[0]!,
  };
}

describe('findMeritoriousMembers', () => {
  it('retient un membre role member, 16/16 sur 3 semaines et au moins 1 don', () => {
    const perfect = member({ tag: '#A', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers(
      [perfect],
      [attendance('#A', [16, 16, 16])],
    );
    expect(candidates.map((c) => c.tag)).toEqual(['#A']);
  });

  it.each(['leader', 'coLeader', 'elder'] as const)(
    'exclut un role %s meme avec un historique parfait',
    (role) => {
      const candidate = member({ tag: '#A', role, donations: 1 });
      const candidates = findMeritoriousMembers(
        [candidate],
        [attendance('#A', [16, 16, 16])],
      );
      expect(candidates).toEqual([]);
    },
  );

  it('exclut un membre sans aucun don cette semaine', () => {
    const candidate = member({ tag: '#A', role: 'member', donations: 0 });
    const candidates = findMeritoriousMembers(
      [candidate],
      [attendance('#A', [16, 16, 16])],
    );
    expect(candidates).toEqual([]);
  });

  it('exclut un membre a 15/16 une seule semaine sur 3', () => {
    const candidate = member({ tag: '#A', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers(
      [candidate],
      [attendance('#A', [16, 15, 16])],
    );
    expect(candidates).toEqual([]);
  });

  it('exclut un membre absent une semaine (null) parmi les 3 dernieres', () => {
    const candidate = member({ tag: '#A', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers(
      [candidate],
      [attendance('#A', [16, null, 16])],
    );
    expect(candidates).toEqual([]);
  });

  it('exclut un membre avec moins de 3 semaines d historique disponible', () => {
    const candidate = member({ tag: '#A', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers([candidate], [attendance('#A', [16, 16])]);
    expect(candidates).toEqual([]);
  });

  it('ignore les semaines au-dela des 3 plus recentes (4e semaine imparfaite sans impact)', () => {
    const candidate = member({ tag: '#A', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers(
      [candidate],
      [attendance('#A', [16, 16, 16, 2])],
    );
    expect(candidates.map((c) => c.tag)).toEqual(['#A']);
  });

  it('exclut un membre absent de l historique de guerre', () => {
    const candidate = member({ tag: '#A', role: 'member', donations: 1 });
    expect(findMeritoriousMembers([candidate], [])).toEqual([]);
  });

  it('trie les resultats par nom puis tag', () => {
    const zoe = member({ tag: '#Z', name: 'Zoe', role: 'member', donations: 1 });
    const anna = member({ tag: '#Y', name: 'Anna', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers(
      [zoe, anna],
      [attendance('#Z', [16, 16, 16]), attendance('#Y', [16, 16, 16])],
    );
    expect(candidates.map((c) => c.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage les homonymes par tag', () => {
    const twinB = member({ tag: '#ZZ', name: 'Jumeau', role: 'member', donations: 1 });
    const twinA = member({ tag: '#AA', name: 'Jumeau', role: 'member', donations: 1 });
    const candidates = findMeritoriousMembers(
      [twinB, twinA],
      [attendance('#ZZ', [16, 16, 16]), attendance('#AA', [16, 16, 16])],
    );
    expect(candidates.map((c) => c.tag)).toEqual(['#AA', '#ZZ']);
  });
});

describe('findWatchlistMembers', () => {
  it('retient un role elder sous le seuil de combats de la semaine en cours', () => {
    const candidate = member({ tag: '#A', role: 'elder' });
    const candidates = findWatchlistMembers(
      [candidate],
      [{ tag: '#A', decksUsed: 7 }],
      8,
    );
    expect(candidates).toEqual([{ member: candidate, currentWeekBattles: 7 }]);
  });

  it.each(['leader', 'coLeader', 'member'] as const)(
    'exclut un role %s meme sous le seuil',
    (role) => {
      const candidate = member({ tag: '#A', role });
      const candidates = findWatchlistMembers(
        [candidate],
        [{ tag: '#A', decksUsed: 2 }],
        8,
      );
      expect(candidates).toEqual([]);
    },
  );

  it('n inclut pas un elder au-dessus ou exactement au seuil', () => {
    const candidate = member({ tag: '#A', role: 'elder' });
    expect(findWatchlistMembers([candidate], [{ tag: '#A', decksUsed: 8 }], 8)).toEqual(
      [],
    );
    expect(findWatchlistMembers([candidate], [{ tag: '#A', decksUsed: 16 }], 8)).toEqual(
      [],
    );
  });

  it('n evalue pas un elder absent de la semaine en cours (pas de guerre)', () => {
    const candidate = member({ tag: '#A', role: 'elder' });
    expect(findWatchlistMembers([candidate], [], 8)).toEqual([]);
  });

  it('trie les resultats par nom puis tag', () => {
    const zoe = member({ tag: '#Z', name: 'Zoe', role: 'elder' });
    const anna = member({ tag: '#Y', name: 'Anna', role: 'elder' });
    const candidates = findWatchlistMembers(
      [zoe, anna],
      [
        { tag: '#Z', decksUsed: 1 },
        { tag: '#Y', decksUsed: 1 },
      ],
      8,
    );
    expect(candidates.map((c) => c.member.name)).toEqual(['Anna', 'Zoe']);
  });
});
