/**
 * Tests du taux de participation hebdomadaire (US 12.4).
 */

import { describe, expect, it } from 'vitest';
import { computeWeeklyParticipation } from './participation';
import type { CurrentWarParticipant } from './current-war';

function participant(overrides: Partial<CurrentWarParticipant>): CurrentWarParticipant {
  return {
    tag: '#A',
    name: 'Alice',
    decksUsedToday: 0,
    decksUsed: 0,
    fame: 0,
    ...overrides,
  };
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

  it('compte un membre actuel absent de la guerre pour 0 combat joue, sans le retirer du denominateur', () => {
    // Retour utilisateur du clan French 4 (#QC29VC08, 2026-08-05) : un
    // membre qui rejoint apres le debut de la guerre en cours n'apparait
    // dans currentriverrace.clan.participants qu'a la guerre suivante
    // (quirk API Supercell) -- il doit quand meme compter dans l'effectif
    // au denominateur, pas en disparaitre silencieusement.
    const result = computeWeeklyParticipation(
      [participant({ tag: '#A', decksUsed: 16 })],
      ['#A', '#B'],
    );
    expect(result.battlesPlayed).toBe(16);
    expect(result.battlesPossible).toBe(32);
    expect(result.ratio).toBe(0.5);
  });

  it('base le denominateur sur l effectif actuel meme si tous les membres ne sont pas encore inscrits a la guerre', () => {
    const result = computeWeeklyParticipation(
      [participant({ tag: '#A', decksUsed: 8 })],
      ['#A', '#B', '#C'],
    );
    expect(result.battlesPossible).toBe(48);
  });
});
