/**
 * Tests de la serialisation de la liste "A expulser" pour le presse-papiers
 * (US 12.3, message unique de moderation).
 */

import { describe, expect, it } from 'vitest';
import { formatModerationReportForClipboard } from './purge-export';
import type { PurgeCandidate } from '@/domain/clan/purge';

function candidate(overrides: Partial<PurgeCandidate>): PurgeCandidate {
  return {
    member: {
      tag: '#A',
      name: 'Alice',
      role: 'member',
      trophies: 5000,
      donations: 0,
    },
    currentWeekBattles: 3,
    ...overrides,
  };
}

describe('formatModerationReportForClipboard', () => {
  it('retourne une chaine vide pour une liste vide', () => {
    expect(formatModerationReportForClipboard([], 8)).toBe('');
  });

  it('formate un message unique avec un candidat et le seuil actif', () => {
    const text = formatModerationReportForClipboard([candidate({})], 8);
    expect(text).toBe(
      "⚠️ Mise au point du Clan : Les joueurs suivants n'ont pas respecté le " +
        'quota de combats cette semaine sur 8 : Alice. Merci de corriger le tir rapidement !',
    );
  });

  it('separe les noms de plusieurs candidats par une virgule', () => {
    const text = formatModerationReportForClipboard(
      [
        candidate({ member: { ...candidate({}).member, name: 'Alice' } }),
        candidate({ member: { ...candidate({}).member, name: 'Bob' } }),
      ],
      8,
    );
    expect(text).toContain('Alice, Bob');
  });

  it('affiche le seuil actif transmis, pas une valeur en dur', () => {
    const text = formatModerationReportForClipboard([candidate({})], 10);
    expect(text).toContain('cette semaine sur 10');
  });
});
