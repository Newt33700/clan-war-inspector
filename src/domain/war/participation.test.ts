/**
 * Tests du taux de participation hebdomadaire (US 12.4).
 */

import { describe, expect, it } from 'vitest';
import { computeWeeklyParticipation } from './participation';
import type { CurrentWarParticipant } from './current-war';

function participant(overrides: Partial<CurrentWarParticipant>): CurrentWarParticipant {
  return { tag: '#A', name: 'Alice', decksUsedToday: 0, decksUsed: 0, ...overrides };
}

describe('computeWeeklyParticipation', () => {
  it('retourne un ratio nul sans aucun membre actuel inscrit', () => {
    const result = computeWeeklyParticipation([], []);
    expect(result).toEqual({ battlesPlayed: 0, battlesPossible: 0, ratio: 0 });
  });

  it('exclut les participants qui ont quitte le clan', () => {
    const result = computeWeeklyParticipation(
      [participant({ tag: '#A', decksUsed: 16 })],
      [],
    );
    expect(result).toEqual({ battlesPlayed: 0, battlesPossible: 0, ratio: 0 });
  });

  it('calcule le ratio combats joues sur combats possibles (16 par membre actuel)', () => {
    const result = computeWeeklyParticipation(
      [
        participant({ tag: '#A', decksUsed: 16 }),
        participant({ tag: '#B', decksUsed: 8 }),
      ],
      ['#A', '#B'],
    );
    expect(result).toEqual({ battlesPlayed: 24, battlesPossible: 32, ratio: 0.75 });
  });

  it('ignore un membre actuel absent de la guerre dans le decompte des combats joues', () => {
    const result = computeWeeklyParticipation(
      [participant({ tag: '#A', decksUsed: 16 })],
      ['#A', '#B'],
    );
    expect(result.battlesPlayed).toBe(16);
    expect(result.battlesPossible).toBe(16);
    expect(result.ratio).toBe(1);
  });
});
