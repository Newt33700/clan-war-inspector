/**
 * Tests de la serialisation de la liste "A expulser" pour le presse-papiers
 * (US 6.6).
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
    reasons: ['ZERO_DONATIONS'],
    totalWarBattles: 3,
    ...overrides,
  };
}

describe('formatPurgeCandidatesForClipboard', () => {
  it('retourne une chaine vide pour une liste vide', () => {
    expect(formatPurgeCandidatesForClipboard([])).toBe('');
  });

  it('formate un candidat avec ses motifs en francais', () => {
    const text = formatPurgeCandidatesForClipboard([candidate({})]);
    expect(text).toBe('Alice (#A) - Aucun don');
  });

  it('joint plusieurs motifs par une virgule', () => {
    const text = formatPurgeCandidatesForClipboard([
      candidate({ reasons: ['ZERO_DONATIONS', 'LOW_WAR_ACTIVITY'] }),
    ]);
    expect(text).toBe('Alice (#A) - Aucun don, Combats de guerre insuffisants');
  });

  it('produit une ligne par candidat, dans l ordre fourni', () => {
    const text = formatPurgeCandidatesForClipboard([
      candidate({ member: { ...candidate({}).member, tag: '#A', name: 'Alice' } }),
      candidate({ member: { ...candidate({}).member, tag: '#B', name: 'Bob' } }),
    ]);
    expect(text.split('\n')).toEqual(['Alice (#A) - Aucun don', 'Bob (#B) - Aucun don']);
  });
});
