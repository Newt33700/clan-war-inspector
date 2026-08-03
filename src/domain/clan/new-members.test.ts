/**
 * Tests de la detection des nouveaux membres (US 11, "Sas de Quarantaine").
 *
 * Regle : un membre actuel est "nouveau" quand son tag n'apparait dans
 * aucune des `NEW_MEMBER_LOOKBACK_WEEKS` dernieres semaines de
 * riverracelog. Fonction pure, perimetre Stryker (domain/), couverture
 * et mutation exigees a 100 %/>90 %.
 */

import { describe, expect, it } from 'vitest';
import { findNewMembers, NEW_MEMBER_LOOKBACK_WEEKS } from './new-members';
import type { ClanMember } from './members';
import type { WarWeek } from '../war/war-history';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    trophies: 5000,
    donations: 0,
    ...overrides,
  };
}

function week(tags: string[]): WarWeek {
  return {
    weekId: `w-${tags.join('-')}`,
    seasonId: null,
    sectionIndex: null,
    createdDate: null,
    participants: tags.map((tag) => ({ tag, name: tag, battlesPlayed: 16 })),
  };
}

describe('NEW_MEMBER_LOOKBACK_WEEKS', () => {
  it('regarde les 3 dernieres semaines (US 11)', () => {
    expect(NEW_MEMBER_LOOKBACK_WEEKS).toBe(3);
  });
});

describe('findNewMembers', () => {
  it('retient un membre actuel absent de toutes les semaines fournies', () => {
    const newcomer = member({ tag: '#NEW', name: 'Nouveau' });
    const veteran = member({ tag: '#OLD', name: 'Ancien' });
    const result = findNewMembers([veteran, newcomer], [week(['#OLD'])]);
    expect(result).toEqual([newcomer]);
  });

  it('exclut un membre present dans au moins une semaine', () => {
    const veteran = member({ tag: '#OLD' });
    const result = findNewMembers([veteran], [week(['#OLD'])]);
    expect(result).toEqual([]);
  });

  it('exclut un membre present uniquement dans une semaine plus ancienne que la fenetre', () => {
    const veteran = member({ tag: '#OLD' });
    const result = findNewMembers(
      [veteran],
      [week(['#AUTRE1']), week(['#AUTRE2']), week(['#AUTRE3']), week(['#OLD'])],
    );
    expect(result).toEqual([veteran]);
  });

  it('retient un membre present seulement dans la semaine la plus ancienne de la fenetre (3e)', () => {
    const veteran = member({ tag: '#OLD' });
    const result = findNewMembers(
      [veteran],
      [week(['#AUTRE1']), week(['#AUTRE2']), week(['#OLD'])],
    );
    expect(result).toEqual([]);
  });

  it('tous les membres sont nouveaux sans aucun historique de guerre', () => {
    const alice = member({ tag: '#A' });
    const bob = member({ tag: '#B' });
    expect(findNewMembers([alice, bob], [])).toEqual([alice, bob]);
  });

  it('retourne un tableau vide sans membre actuel', () => {
    expect(findNewMembers([], [week(['#OLD'])])).toEqual([]);
  });

  it('conserve l ordre d origine des membres', () => {
    const alice = member({ tag: '#A', name: 'Alice' });
    const bob = member({ tag: '#B', name: 'Bob' });
    expect(findNewMembers([bob, alice], [])).toEqual([bob, alice]);
  });

  it('ne mute ni le tableau de membres ni celui des semaines', () => {
    const members = [member({ tag: '#A' })];
    const weeks = [week(['#B'])];
    findNewMembers(members, weeks);
    expect(members).toHaveLength(1);
    expect(weeks).toHaveLength(1);
  });

  it('une semaine sans aucun participant ne rend personne nouveau a tort', () => {
    const alice = member({ tag: '#A' });
    expect(findNewMembers([alice], [week([])])).toEqual([alice]);
  });
});
