/**
 * Tests de "Consistency Trend" / la Meteo du Clan (US 12) : regression
 * lineaire simple sur les 5 dernieres semaines de `decksUsed`, et
 * classification du profil d'engagement. Perimetre Stryker (domain/),
 * couverture 100 % et mutation > 95 % exigees specifiquement sur ce
 * fichier (US 12, point 4).
 */

import { describe, expect, it } from 'vitest';
import type { ClanMember } from '../clan/members';
import type { WarWeek } from './war-history';
import {
  classifyConsistencyTrend,
  computeConsistencyTrends,
  computeLinearRegressionSlope,
  CONSISTENCY_PROFILE_LABELS,
  sortConsistencyTrends,
  type ConsistencyProfile,
  type MemberConsistencyTrend,
} from './consistency-trend';

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

/** 5 semaines realistes, la plus recente en tete (ordre de parseRiverRaceLog). */
function fiveWeeks(
  perWeekTags: readonly (readonly { tag: string; battlesPlayed: number }[])[],
): WarWeek[] {
  return perWeekTags.map((participants, index) => ({
    weekId: `w${index}`,
    seasonId: null,
    sectionIndex: null,
    createdDate: null,
    participants: participants.map((p) => ({
      tag: p.tag,
      name: p.tag,
      battlesPlayed: p.battlesPlayed,
    })),
  }));
}

describe('computeLinearRegressionSlope', () => {
  it('vaut 0 pour un tableau vide (pas assez de points)', () => {
    expect(computeLinearRegressionSlope([])).toBe(0);
  });

  it('vaut 0 pour un seul point (pas assez de points)', () => {
    expect(computeLinearRegressionSlope([10])).toBe(0);
  });

  it('vaut 0 pour une serie constante', () => {
    expect(computeLinearRegressionSlope([8, 8, 8, 8, 8])).toBe(0);
  });

  it('vaut 1 pour une progression parfaitement lineaire de +1/semaine', () => {
    expect(computeLinearRegressionSlope([12, 13, 14, 15, 16])).toBe(1);
  });

  it('vaut -1 pour une regression parfaitement lineaire de -1/semaine', () => {
    expect(computeLinearRegressionSlope([16, 15, 14, 13, 12])).toBe(-1);
  });

  it('calcule la pente exacte de l exemple "Decrocheur" du backlog (16,16,12,8,4)', () => {
    // x = 1..5, y = 16,16,12,8,4 : x_moy=3, y_moy=11.2
    // Sum((x-x_moy)(y-y_moy)) = -32, Sum((x-x_moy)^2) = 10 => m = -3.2
    expect(computeLinearRegressionSlope([16, 16, 12, 8, 4])).toBeCloseTo(-3.2);
  });

  it('calcule la pente exacte pour une serie a 2 points', () => {
    // x=1,2 y=4,10 : x_moy=1.5, y_moy=7 => Sum=(−0.5)(−3)+(0.5)(3)=3, denom=0.5 => m=6
    expect(computeLinearRegressionSlope([4, 10])).toBe(6);
  });

  it('n est pas affectee par un decalage vertical constant (translation de y)', () => {
    const base = computeLinearRegressionSlope([1, 3, 2, 5, 4]);
    const shifted = computeLinearRegressionSlope([101, 103, 102, 105, 104]);
    expect(shifted).toBeCloseTo(base);
  });
});

describe('classifyConsistencyTrend', () => {
  it('Le Roc : moyenne >= 14 et pente >= -0.5 (stable ou en hausse)', () => {
    expect(classifyConsistencyTrend(15.8, 0)).toBe('roc');
  });

  it('Le Roc : bornes incluses (moyenne = 14, pente = -0.5)', () => {
    expect(classifyConsistencyTrend(14, -0.5)).toBe('roc');
  });

  it('Pas Le Roc si la moyenne est juste sous 14', () => {
    expect(classifyConsistencyTrend(13.9, 0)).not.toBe('roc');
  });

  it('Pas Le Roc si la pente est juste sous -0.5', () => {
    expect(classifyConsistencyTrend(15, -0.51)).not.toBe('roc');
  });

  it('Le Decrocheur : pente <= -1.5 (chute marquee, exemple du backlog)', () => {
    expect(classifyConsistencyTrend(11.2, -3.2)).toBe('decrocheur');
  });

  it('Le Decrocheur : borne incluse (pente = -1.5)', () => {
    expect(classifyConsistencyTrend(10, -1.5)).toBe('decrocheur');
  });

  it('Pas Decrocheur si la pente est juste au dessus de -1.5', () => {
    expect(classifyConsistencyTrend(10, -1.49)).not.toBe('decrocheur');
  });

  it('En Redemption : pente >= 2.0 (forte progression)', () => {
    expect(classifyConsistencyTrend(8.4, 3.2)).toBe('redemption');
  });

  it('En Redemption : borne incluse (pente = 2.0)', () => {
    expect(classifyConsistencyTrend(8, 2)).toBe('redemption');
  });

  it('Pas Redemption si la pente est juste sous 2.0', () => {
    expect(classifyConsistencyTrend(8, 1.99)).not.toBe('redemption');
  });

  it('Le Touriste : moyenne <= 4', () => {
    expect(classifyConsistencyTrend(2, 0)).toBe('touriste');
  });

  it('Le Touriste : borne incluse (moyenne = 4)', () => {
    expect(classifyConsistencyTrend(4, 0)).toBe('touriste');
  });

  it('Pas Touriste si la moyenne est juste au dessus de 4', () => {
    expect(classifyConsistencyTrend(4.01, 0)).not.toBe('touriste');
  });

  it('Irregulier : ne rentre dans aucune categorie (stable a mi-parcours)', () => {
    expect(classifyConsistencyTrend(8, 0)).toBe('irregulier');
  });

  it('priorite : Decrocheur l emporte sur Touriste quand les deux matchent', () => {
    // decksUsed 8,6,4,2,0 : moyenne = 4 (Touriste) ET pente = -2 (Decrocheur).
    expect(classifyConsistencyTrend(4, -2)).toBe('decrocheur');
  });

  it('priorite : Le Roc est verifie avant Decrocheur (mutuellement exclusifs par construction, verrouille explicitement)', () => {
    // Sanity : une pente >= -0.5 ne peut jamais aussi etre <= -1.5, donc
    // Roc et Decrocheur ne se recouvrent jamais dans les faits ; ce test
    // fige neanmoins le cas nominal du Roc pour eviter une regression
    // d'ordre de verification.
    expect(classifyConsistencyTrend(16, 0.5)).toBe('roc');
  });
});

describe('computeConsistencyTrends', () => {
  const roc = member({ tag: '#ROC', name: 'Roc' });
  const decro = member({ tag: '#DECRO', name: 'Decro' });
  const newish = member({ tag: '#NEWISH', name: 'Newish' });
  const brandNew = member({ tag: '#BRANDNEW', name: 'BrandNew' });
  const members = [roc, decro, newish, brandNew];

  const weeks = fiveWeeks([
    [
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 4 },
      { tag: '#NEWISH', battlesPlayed: 10 },
      { tag: '#GONE', battlesPlayed: 2 },
    ],
    [
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 8 },
      { tag: '#NEWISH', battlesPlayed: 10 },
    ],
    [
      { tag: '#ROC', battlesPlayed: 15 },
      { tag: '#DECRO', battlesPlayed: 12 },
    ],
    [
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 16 },
    ],
    [
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 16 },
    ],
  ]);

  it('calcule la tendance en ordre chronologique (le plus ancien des 5 en premier)', () => {
    const trends = computeConsistencyTrends(members, weeks);
    expect(trends.find((t) => t.tag === '#ROC')?.weeklyValues).toEqual([
      16, 16, 15, 16, 16,
    ]);
  });

  it('classe correctement chaque membre a historique complet', () => {
    const trends = computeConsistencyTrends(members, weeks);
    expect(trends.find((t) => t.tag === '#ROC')?.profile).toBe('roc');
    expect(trends.find((t) => t.tag === '#DECRO')?.profile).toBe('decrocheur');
  });

  it('calcule la moyenne exacte sur les 5 semaines (16+16+15+16+16)/5', () => {
    const trends = computeConsistencyTrends(members, weeks);
    expect(trends.find((t) => t.tag === '#ROC')?.average).toBe(15.8);
  });

  it('exclut un membre sans historique complet sur les 5 semaines (arrive recemment)', () => {
    const trends = computeConsistencyTrends(members, weeks);
    expect(trends.find((t) => t.tag === '#NEWISH')).toBeUndefined();
  });

  it('exclut un membre totalement absent du log (jamais vu en guerre)', () => {
    const trends = computeConsistencyTrends(members, weeks);
    expect(trends.find((t) => t.tag === '#BRANDNEW')).toBeUndefined();
  });

  it('exclut tout le monde si le clan a moins de 5 semaines d historique connues', () => {
    const shortHistory = fiveWeeks([
      [{ tag: '#ROC', battlesPlayed: 16 }],
      [{ tag: '#ROC', battlesPlayed: 16 }],
      [{ tag: '#ROC', battlesPlayed: 16 }],
    ]);
    expect(computeConsistencyTrends(members, shortHistory)).toEqual([]);
  });

  it('exclut un joueur present dans le log mais plus membre actuel', () => {
    const trends = computeConsistencyTrends(members, weeks);
    expect(trends.find((t) => t.tag === '#GONE')).toBeUndefined();
  });

  it('ne regarde que les 5 dernieres semaines, ignore les plus anciennes', () => {
    const sixthOlderWeek: WarWeek = {
      weekId: 'w-old',
      seasonId: null,
      sectionIndex: null,
      createdDate: null,
      participants: [{ tag: '#ROC', name: '#ROC', battlesPlayed: 0 }],
    };
    const trendsWithExtra = computeConsistencyTrends(members, [...weeks, sixthOlderWeek]);
    expect(trendsWithExtra.find((t) => t.tag === '#ROC')?.weeklyValues).toEqual([
      16, 16, 15, 16, 16,
    ]);
  });

  it('retourne un tableau vide sans membre', () => {
    expect(computeConsistencyTrends([], weeks)).toEqual([]);
  });
});

describe('sortConsistencyTrends', () => {
  function trend(
    tag: string,
    name: string,
    profile: ConsistencyProfile,
  ): MemberConsistencyTrend {
    return { tag, name, weeklyValues: [], average: 0, slope: 0, profile };
  }

  it('place Le Decrocheur et Le Touriste en tete, Le Roc en dernier', () => {
    const roc = trend('#A', 'Alice', 'roc');
    const decro = trend('#B', 'Bob', 'decrocheur');
    const touriste = trend('#C', 'Carol', 'touriste');
    const irregulier = trend('#D', 'Dave', 'irregulier');
    const redemption = trend('#E', 'Eve', 'redemption');

    const sorted = sortConsistencyTrends([roc, irregulier, redemption, touriste, decro]);
    expect(sorted.map((t) => t.tag)).toEqual(['#B', '#C', '#D', '#E', '#A']);
  });

  it('departage a profil egal par nom ascendant', () => {
    const zoe = trend('#Z', 'Zoe', 'decrocheur');
    const anna = trend('#A', 'Anna', 'decrocheur');
    expect(sortConsistencyTrends([zoe, anna]).map((t) => t.name)).toEqual([
      'Anna',
      'Zoe',
    ]);
  });

  it('departage les homonymes par tag ascendant', () => {
    const twinB = trend('#ZZ', 'Jumeau', 'decrocheur');
    const twinA = trend('#AA', 'Jumeau', 'decrocheur');
    expect(sortConsistencyTrends([twinB, twinA]).map((t) => t.tag)).toEqual([
      '#AA',
      '#ZZ',
    ]);
  });

  it('ne mute pas le tableau d entree', () => {
    const input = [trend('#A', 'Alice', 'roc'), trend('#B', 'Bob', 'decrocheur')];
    const copy = [...input];
    sortConsistencyTrends(input);
    expect(input).toEqual(copy);
  });
});

describe('CONSISTENCY_PROFILE_LABELS', () => {
  it('fournit un libelle francais distinct pour chaque profil', () => {
    const labels = Object.values(CONSISTENCY_PROFILE_LABELS);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
