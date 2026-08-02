/**
 * Tests de la vue de renvoi (US 5.1) et du combinateur ET/OU (US 6.6).
 * Perimetre Stryker : chaque branche de la regle de combinaison et
 * chaque cle de tri sont verrouillees par un cas explicite.
 */

import { describe, expect, it } from 'vitest';
import { findPurgeCandidates, PURGE_REASON_LABELS } from './purge';
import type { ClanMember } from './members';
import type { PlayerAttendance } from '../war/war-history';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    expLevel: 10,
    trophies: 5000,
    donations: 100,
    ...overrides,
  };
}

function attendance(tag: string, totalBattles: number): PlayerAttendance {
  return {
    tag,
    name: tag,
    battlesByWeek: [],
    totalBattles,
    weeksPresent: 1,
    averagePerPresentWeek: totalBattles,
  };
}

describe('PURGE_REASON_LABELS', () => {
  it('fournit un libelle francais pour chaque motif', () => {
    expect(Object.values(PURGE_REASON_LABELS).every((label) => label.length > 0)).toBe(
      true,
    );
  });
});

describe('findPurgeCandidates', () => {
  const inactive = member({ tag: '#A', name: 'Alice', donations: 0 });
  const bigDonorLowBattles = member({ tag: '#B', name: 'Bob', donations: 500 });
  const zeroDonorHighBattles = member({ tag: '#C', name: 'Carol', donations: 0 });
  const clean = member({ tag: '#D', name: 'Dave', donations: 200 });

  const members = [inactive, bigDonorLowBattles, zeroDonorHighBattles, clean];
  const attendanceList = [
    attendance('#A', 2),
    attendance('#B', 3),
    attendance('#C', 16),
    attendance('#D', 16),
  ];

  it('combinateur AND (defaut) : ne retient que 0 don ET combats insuffisants', () => {
    const candidates = findPurgeCandidates(members, attendanceList, {
      minWarBattles: 8,
    });
    expect(candidates.map((c) => c.member.tag)).toEqual(['#A']);
    expect(candidates[0]?.reasons).toEqual(['ZERO_DONATIONS', 'LOW_WAR_ACTIVITY']);
  });

  it('combinateur AND explicite : identique au defaut', () => {
    const candidates = findPurgeCandidates(members, attendanceList, {
      minWarBattles: 8,
      combinator: 'AND',
    });
    expect(candidates.map((c) => c.member.tag)).toEqual(['#A']);
  });

  it('combinateur OR : retient chaque critere independamment', () => {
    const candidates = findPurgeCandidates(members, attendanceList, {
      minWarBattles: 8,
      combinator: 'OR',
    });
    // #A : les deux criteres. #B : combats insuffisants seul. #C : 0 don seul.
    expect(candidates.map((c) => c.member.tag).sort()).toEqual(['#A', '#B', '#C']);
    const bob = candidates.find((c) => c.member.tag === '#B');
    expect(bob?.reasons).toEqual(['LOW_WAR_ACTIVITY']);
    const carol = candidates.find((c) => c.member.tag === '#C');
    expect(carol?.reasons).toEqual(['ZERO_DONATIONS']);
  });

  it('traite un membre absent de l historique comme 0 combat', () => {
    const candidates = findPurgeCandidates(
      [member({ tag: '#E', name: 'Eve', donations: 0 })],
      [],
      { minWarBattles: 1 },
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.totalWarBattles).toBeNull();
  });

  it('n inclut personne si aucun critere n est franchi', () => {
    expect(findPurgeCandidates([clean], attendanceList, { minWarBattles: 1 })).toEqual(
      [],
    );
  });

  it('n inclut pas un joueur dont les combats atteignent exactement le seuil', () => {
    const atThreshold = member({ tag: '#F', name: 'Faye', donations: 100 });
    const candidates = findPurgeCandidates([atThreshold], [attendance('#F', 8)], {
      minWarBattles: 8,
      combinator: 'OR',
    });
    expect(candidates).toEqual([]);
  });

  it('trie par combats croissants, puis dons croissants, puis nom puis tag', () => {
    const tie1 = member({ tag: '#Z', name: 'Zoe', donations: 0 });
    const tie2 = member({ tag: '#Y', name: 'Anna', donations: 0 });
    const moreBattles = member({ tag: '#X', name: 'Xena', donations: 0 });
    const candidates = findPurgeCandidates(
      [moreBattles, tie1, tie2],
      [attendance('#Z', 1), attendance('#Y', 1), attendance('#X', 5)],
      { minWarBattles: 10 },
    );
    expect(candidates.map((c) => c.member.tag)).toEqual(['#Y', '#Z', '#X']);
  });

  it('departage a combats egaux par les dons croissants', () => {
    // Noms delibrement inverses par rapport aux dons : un tri qui
    // ignorerait la comparaison de dons et retomberait sur le nom
    // donnerait le mauvais ordre ici.
    const candidates = findPurgeCandidates(
      [
        member({ tag: '#Z', name: 'Zoe', donations: 5 }),
        member({ tag: '#Y', name: 'Anna', donations: 20 }),
      ],
      [attendance('#Z', 1), attendance('#Y', 1)],
      { minWarBattles: 10, combinator: 'OR' },
    );
    expect(candidates.map((c) => c.member.name)).toEqual(['Zoe', 'Anna']);
  });

  it('trie 3 candidats par dons croissants (au-dela d une simple paire)', () => {
    // Les dons ne sont jamais negatifs : une comparaison inversee (+ au
    // lieu de -) peut laisser une paire adjacente inchangee par hasard.
    // 3 elements avec un ordre initial deja "presque trie" force un vrai
    // reordonnancement transitif que seule la soustraction produit.
    const candidates = findPurgeCandidates(
      [
        member({ tag: '#C', name: 'Carol', donations: 30 }),
        member({ tag: '#A', name: 'Alice', donations: 5 }),
        member({ tag: '#B', name: 'Bob', donations: 15 }),
      ],
      [attendance('#C', 1), attendance('#A', 1), attendance('#B', 1)],
      { minWarBattles: 10, combinator: 'OR' },
    );
    expect(candidates.map((c) => c.member.name)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('departage a dons egaux par le nom', () => {
    const candidates = findPurgeCandidates(
      [
        member({ tag: '#Z', name: 'Zoe', donations: 0 }),
        member({ tag: '#Y', name: 'Anna', donations: 0 }),
      ],
      [attendance('#Z', 1), attendance('#Y', 1)],
      { minWarBattles: 10 },
    );
    expect(candidates.map((c) => c.member.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage les homonymes par le tag quand nom et dons sont egaux', () => {
    const candidates = findPurgeCandidates(
      [
        member({ tag: '#Z', name: 'Jumeau', donations: 0 }),
        member({ tag: '#A', name: 'Jumeau', donations: 0 }),
      ],
      [attendance('#Z', 1), attendance('#A', 1)],
      { minWarBattles: 10 },
    );
    expect(candidates.map((c) => c.member.tag)).toEqual(['#A', '#Z']);
  });

  it('traite deux membres absents de l historique comme egaux (0 combat) au tri', () => {
    const candidates = findPurgeCandidates(
      [
        member({ tag: '#Z', name: 'Zoe', donations: 0 }),
        member({ tag: '#A', name: 'Anna', donations: 0 }),
      ],
      [],
      { minWarBattles: 10 },
    );
    expect(candidates.map((c) => c.member.name)).toEqual(['Anna', 'Zoe']);
  });
});
