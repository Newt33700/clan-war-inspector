/**
 * Tests de la vue de renvoi "A expulser" (regle produit du 2026-08-02) :
 * role Membre et combats sur la semaine de guerre en cours sous un
 * seuil configurable. Perimetre Stryker : chaque garde et chaque cle de
 * tri sont verrouilles par un cas explicite.
 */

import { describe, expect, it } from 'vitest';
import { findPurgeCandidates } from './purge';
import type { ClanMember } from './members';

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

function participant(tag: string, decksUsed: number) {
  return { tag, decksUsed };
}

describe('findPurgeCandidates', () => {
  it('retient un membre sous le seuil de combats cette semaine', () => {
    const alice = member({ tag: '#A', name: 'Alice' });
    const candidates = findPurgeCandidates([alice], [participant('#A', 3)], 8);
    expect(candidates).toEqual([{ member: alice, currentWeekBattles: 3 }]);
  });

  it('ignore un membre au-dessus ou exactement au seuil', () => {
    const alice = member({ tag: '#A', name: 'Alice' });
    expect(findPurgeCandidates([alice], [participant('#A', 8)], 8)).toEqual([]);
    expect(findPurgeCandidates([alice], [participant('#A', 16)], 8)).toEqual([]);
  });

  it.each(['leader', 'coLeader', 'elder'] as const)(
    'ignore un role %s meme sous le seuil',
    (role) => {
      const candidate = member({ tag: '#A', name: 'Alice', role });
      expect(findPurgeCandidates([candidate], [participant('#A', 0)], 8)).toEqual([]);
    },
  );

  it('n evalue pas un membre absent de la semaine en cours (pas disqualifie par defaut)', () => {
    const alice = member({ tag: '#A', name: 'Alice' });
    expect(findPurgeCandidates([alice], [], 8)).toEqual([]);
  });

  it('trie par combats croissants, tie-break nom puis tag', () => {
    const zoe = member({ tag: '#Z', name: 'Zoe' });
    const anna = member({ tag: '#Y', name: 'Anna' });
    const xena = member({ tag: '#X', name: 'Xena' });
    const candidates = findPurgeCandidates(
      [xena, zoe, anna],
      [participant('#Z', 1), participant('#Y', 1), participant('#X', 5)],
      8,
    );
    expect(candidates.map((c) => c.member.tag)).toEqual(['#Y', '#Z', '#X']);
  });

  it('departage les ex-aequo par nom puis tag', () => {
    const zoe = member({ tag: '#Z', name: 'Zoe' });
    const anna = member({ tag: '#Y', name: 'Anna' });
    const candidates = findPurgeCandidates(
      [zoe, anna],
      [participant('#Z', 1), participant('#Y', 1)],
      8,
    );
    expect(candidates.map((c) => c.member.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage les homonymes par tag', () => {
    const twinZ = member({ tag: '#Z', name: 'Jumeau' });
    const twinA = member({ tag: '#A', name: 'Jumeau' });
    const candidates = findPurgeCandidates(
      [twinZ, twinA],
      [participant('#Z', 1), participant('#A', 1)],
      8,
    );
    expect(candidates.map((c) => c.member.tag)).toEqual(['#A', '#Z']);
  });

  it('ne mute pas le tableau d entree', () => {
    const alice = member({ tag: '#A', name: 'Alice' });
    const bob = member({ tag: '#B', name: 'Bob' });
    const input = [bob, alice];
    findPurgeCandidates(input, [participant('#A', 1), participant('#B', 2)], 8);
    expect(input).toEqual([bob, alice]);
  });
});
