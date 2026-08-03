/**
 * Tests de l'indice de fiabilite des nouveaux membres (US 11).
 *
 * Deux algorithmes purs, perimetre Stryker (domain/), couverture 100 %
 * et mutation >90 % exigees :
 * - `parsePlayerReliabilityStats` : extrait `battleCount` et les
 *   victoires GDC a vie depuis /players/{tag} (badge `ClanWarWins`,
 *   nom verifie sur le clan reel #20J20QG le 2026-08-03 : `progress: 96`
 *   pour un joueur de 9416 combats).
 * - `computeReliabilityLevel` : feu rouge/orange/vert/neutre.
 */

import { describe, expect, it } from 'vitest';
import {
  computeReliabilityLevel,
  parsePlayerReliabilityStats,
  RELIABILITY_LABELS,
} from './reliability';

describe('parsePlayerReliabilityStats', () => {
  it('extrait battleCount et les victoires GDC depuis le badge ClanWarWins', () => {
    const stats = parsePlayerReliabilityStats({
      tag: '#P1',
      battleCount: 9416,
      badges: [
        { name: 'ClanWarsVeteran', progress: 94 },
        { name: 'ClanWarWins', progress: 96 },
        { name: 'ClanDonations', progress: 14630 },
      ],
    });
    expect(stats).toEqual({ battleCount: 9416, clanWarWins: 96 });
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['tableau', []],
    ['chaine', 'oops'],
  ])('retourne null pour une reponse inexploitable (%s)', (_label, raw) => {
    expect(parsePlayerReliabilityStats(raw)).toBeNull();
  });

  it('borne battleCount manquant ou aberrant a 0', () => {
    expect(parsePlayerReliabilityStats({})).toEqual({ battleCount: 0, clanWarWins: 0 });
    expect(parsePlayerReliabilityStats({ battleCount: 'oops' })).toEqual({
      battleCount: 0,
      clanWarWins: 0,
    });
    expect(parsePlayerReliabilityStats({ battleCount: -5 })).toEqual({
      battleCount: 0,
      clanWarWins: 0,
    });
  });

  it('victoires GDC a 0 quand badges est absent', () => {
    expect(parsePlayerReliabilityStats({ battleCount: 100 })).toEqual({
      battleCount: 100,
      clanWarWins: 0,
    });
  });

  it('victoires GDC a 0 quand badges n est pas un tableau', () => {
    expect(parsePlayerReliabilityStats({ battleCount: 100, badges: 'oops' })).toEqual({
      battleCount: 100,
      clanWarWins: 0,
    });
  });

  it('victoires GDC a 0 quand le badge ClanWarWins est absent du tableau', () => {
    expect(
      parsePlayerReliabilityStats({
        battleCount: 100,
        badges: [{ name: 'ClanDonations', progress: 500 }],
      }),
    ).toEqual({ battleCount: 100, clanWarWins: 0 });
  });

  it('ignore une entree de badges non exploitable sans planter', () => {
    expect(
      parsePlayerReliabilityStats({
        battleCount: 100,
        badges: ['oops', null, 42, { name: 'ClanWarWins', progress: 10 }],
      }),
    ).toEqual({ battleCount: 100, clanWarWins: 10 });
  });

  it('coerce un progress non numerique du badge ClanWarWins a 0', () => {
    expect(
      parsePlayerReliabilityStats({
        battleCount: 100,
        badges: [{ name: 'ClanWarWins', progress: 'oops' }],
      }),
    ).toEqual({ battleCount: 100, clanWarWins: 0 });
  });

  it('tronque un progress fractionnaire', () => {
    expect(
      parsePlayerReliabilityStats({
        battleCount: 100,
        badges: [{ name: 'ClanWarWins', progress: 42.9 }],
      }),
    ).toEqual({ battleCount: 100, clanWarWins: 42 });
  });
});

describe('computeReliabilityLevel', () => {
  it('feu rouge : 0 victoire GDC et plus de 1000 combats', () => {
    expect(computeReliabilityLevel({ clanWarWins: 0, battleCount: 1001 })).toBe('red');
  });

  it('pas de feu rouge a exactement 1000 combats (seuil strict)', () => {
    expect(computeReliabilityLevel({ clanWarWins: 0, battleCount: 1000 })).toBe(
      'unknown',
    );
  });

  it('pas de feu rouge des qu il y a au moins 1 victoire GDC', () => {
    expect(computeReliabilityLevel({ clanWarWins: 1, battleCount: 5000 })).not.toBe(
      'red',
    );
  });

  it('feu orange : moins de 30 victoires GDC et plus de 3000 combats', () => {
    expect(computeReliabilityLevel({ clanWarWins: 15, battleCount: 3001 })).toBe(
      'orange',
    );
  });

  it('pas de feu orange a exactement 30 victoires GDC (seuil strict)', () => {
    expect(computeReliabilityLevel({ clanWarWins: 30, battleCount: 5000 })).toBe(
      'unknown',
    );
  });

  it('pas de feu orange a exactement 3000 combats (seuil strict)', () => {
    expect(computeReliabilityLevel({ clanWarWins: 10, battleCount: 3000 })).toBe(
      'unknown',
    );
  });

  it('feu rouge prioritaire sur le feu orange quand les deux regles matchent', () => {
    expect(computeReliabilityLevel({ clanWarWins: 0, battleCount: 5000 })).toBe('red');
  });

  it('feu vert : plus de 50 victoires GDC, meme avec peu de combats', () => {
    expect(computeReliabilityLevel({ clanWarWins: 51, battleCount: 10 })).toBe('green');
  });

  it('pas de feu vert a exactement 50 victoires GDC (seuil strict)', () => {
    expect(computeReliabilityLevel({ clanWarWins: 50, battleCount: 10 })).toBe('unknown');
  });

  it('profil neutre quand aucun seuil n est atteint', () => {
    expect(computeReliabilityLevel({ clanWarWins: 10, battleCount: 500 })).toBe(
      'unknown',
    );
  });
});

describe('RELIABILITY_LABELS', () => {
  it('fournit un libelle francais distinct pour chaque niveau', () => {
    const labels = Object.values(RELIABILITY_LABELS);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
