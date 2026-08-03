/**
 * Tests de la serialisation des recommandations RH pour le presse-papiers
 * (audit UX du 2026-08-02, US-10).
 */

import { describe, expect, it } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import type { WatchCandidate } from '@/domain/clan/hr-assistant';
import {
  formatMeritoriousForClipboard,
  formatWatchlistForClipboard,
} from './hr-recommendations-export';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    trophies: 5000,
    donations: 1,
    ...overrides,
  };
}

describe('formatMeritoriousForClipboard', () => {
  it('formate une ligne par meritant', () => {
    const alice = member({ tag: '#A', name: 'Alice' });
    const bob = member({ tag: '#B', name: 'Bob' });
    expect(formatMeritoriousForClipboard([alice, bob])).toBe(
      'Alice (#A) - Promotion suggeree : Aine\nBob (#B) - Promotion suggeree : Aine',
    );
  });

  it('retourne une chaine vide sans meritant', () => {
    expect(formatMeritoriousForClipboard([])).toBe('');
  });
});

describe('formatWatchlistForClipboard', () => {
  it('formate une ligne par candidat avec son nombre de combats cette semaine', () => {
    const candidate: WatchCandidate = {
      member: member({ tag: '#C', name: 'Carol', role: 'elder' }),
      currentWeekBattles: 4,
    };
    expect(formatWatchlistForClipboard([candidate])).toBe(
      'Carol (#C) - 4 combats cette semaine',
    );
  });

  it('retourne une chaine vide sans candidat', () => {
    expect(formatWatchlistForClipboard([])).toBe('');
  });
});
