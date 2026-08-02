/**
 * Tests de la serialisation de la liste "A expulser" pour le presse-papiers
 * (US 6.6, regle produit du 2026-08-02).
 */

import { describe, expect, it } from 'vitest';
import { formatPurgeCandidatesForClipboard } from './purge-export';
import type { PurgeCandidate } from '@/domain/clan/purge';

function candidate(overrides: Partial<PurgeCandidate>): PurgeCandidate {
  return {
    member: {
      tag: '#A',
      name: 'Alice',
      role: 'member',
      expLevel: 10,
      trophies: 5000,
      donations: 0,
    },
    currentWeekBattles: 3,
    ...overrides,
  };
}

describe('formatPurgeCandidatesForClipboard', () => {
  it('retourne une chaine vide pour une liste vide', () => {
    expect(formatPurgeCandidatesForClipboard([])).toBe('');
  });

  it('formate un candidat avec son nombre de combats cette semaine', () => {
    const text = formatPurgeCandidatesForClipboard([candidate({})]);
    expect(text).toBe('Alice (#A) - 3 combats cette semaine');
  });

  it('produit une ligne par candidat, dans l ordre fourni', () => {
    const text = formatPurgeCandidatesForClipboard([
      candidate({ member: { ...candidate({}).member, tag: '#A', name: 'Alice' } }),
      candidate({
        member: { ...candidate({}).member, tag: '#B', name: 'Bob' },
        currentWeekBattles: 5,
      }),
    ]);
    expect(text.split('\n')).toEqual([
      'Alice (#A) - 3 combats cette semaine',
      'Bob (#B) - 5 combats cette semaine',
    ]);
  });
});
