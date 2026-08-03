/**
 * "Consistency Trend" / la Meteo du Clan (US 12) : anticipe les baisses
 * d'engagement en regardant la tendance des 5 dernieres semaines de
 * `decksUsed` par joueur, plutot que la seule semaine en cours.
 *
 * Regression lineaire simple (methode des moindres carres) : x = index
 * chronologique de la semaine (1 = la plus ancienne des 5, 5 = la plus
 * recente), y = `decksUsed` (0 a 16). La pente m indique la tendance :
 * negative = engagement en baisse, positive = en hausse.
 */

import type { ClanMember } from '../clan/members';
import { computeAttendance, type WarWeek } from './war-history';

/** Nombre de semaines analysees par cette fonctionnalite. */
export const CONSISTENCY_WEEKS = 5;

/**
 * Pente m de la droite de regression lineaire de `values` (methode des
 * moindres carres), x valant 1..n dans l'ordre chronologique fourni.
 * `0` si moins de 2 points (une pente n'a pas de sens sur un seul point).
 */
export function computeLinearRegressionSlope(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) {
    return 0;
  }

  // Simplification algebrique de Sum((x-x_moy)(y-y_moy)) : en developpant,
  // ce terme vaut Sum((x-x_moy)*y) - y_moy*Sum(x-x_moy). Or Sum(x-x_moy)
  // vaut toujours exactement 0 par definition de la moyenne, donc le
  // second terme s'annule quelle que soit la valeur de y_moy - inutile
  // de la calculer pour la pente (elle compterait pour l'ordonnee a
  // l'origine, non demandee ici).
  const meanX = (n + 1) / 2;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = index + 1 - meanX;
    numerator += dx * values[index]!;
    denominator += dx * dx;
  }

  return numerator / denominator;
}

export type ConsistencyProfile =
  'roc' | 'decrocheur' | 'redemption' | 'touriste' | 'irregulier';

/** Moyenne minimale (incluse) pour "Le Roc". */
const ROC_MIN_AVERAGE = 14;
/** Pente minimale (incluse) pour "Le Roc" : stable ou en hausse. */
const ROC_MIN_SLOPE = -0.5;
/** Pente maximale (incluse) pour "Le Decrocheur" : chute marquee. */
const DECROCHEUR_MAX_SLOPE = -1.5;
/** Pente minimale (incluse) pour "En Redemption" : forte progression. */
const REDEMPTION_MIN_SLOPE = 2.0;
/** Moyenne maximale (incluse) pour "Le Touriste". */
const TOURISTE_MAX_AVERAGE = 4;

/**
 * Classe un joueur selon sa moyenne et sa pente sur les 5 dernieres
 * semaines (US 12, regles produit). Ordre de verification explicite,
 * du signal le plus specifique/actionnable au plus generique :
 *
 * 1. Le Roc et Le Decrocheur sont mutuellement exclusifs par construction
 *    (une pente ne peut pas etre a la fois >= -0.5 et <= -1.5) : leur
 *    ordre relatif est donc sans consequence.
 * 2. Le Decrocheur est verifie avant Le Touriste : une moyenne basse ET
 *    une chute marquee (ex. 8,6,4,2,0) doivent alerter sur la chute en
 *    cours, information plus actionnable qu'un simple "faible volume".
 * 3. Irregulier est le repli final : tout profil qui ne correspond a
 *    aucune regle explicite.
 */
export function classifyConsistencyTrend(
  average: number,
  slope: number,
): ConsistencyProfile {
  if (average >= ROC_MIN_AVERAGE && slope >= ROC_MIN_SLOPE) {
    return 'roc';
  }
  if (slope <= DECROCHEUR_MAX_SLOPE) {
    return 'decrocheur';
  }
  if (slope >= REDEMPTION_MIN_SLOPE) {
    return 'redemption';
  }
  if (average <= TOURISTE_MAX_AVERAGE) {
    return 'touriste';
  }
  return 'irregulier';
}

/** Libelles francais des badges, jamais la seule couleur ne porte l'information. */
export const CONSISTENCY_PROFILE_LABELS: Record<ConsistencyProfile, string> = {
  roc: 'Le Roc',
  decrocheur: 'Le Decrocheur',
  redemption: 'En Redemption',
  touriste: 'Le Touriste',
  irregulier: 'Irregulier',
};

export interface MemberConsistencyTrend {
  tag: string;
  name: string;
  /** `decksUsed` des `CONSISTENCY_WEEKS` dernieres semaines, du plus ancien au plus recent. */
  weeklyValues: number[];
  average: number;
  slope: number;
  profile: ConsistencyProfile;
}

/**
 * Calcule la tendance des `CONSISTENCY_WEEKS` dernieres semaines pour
 * chaque membre actuel. Reutilise `computeAttendance` (moteur
 * d'historique, US 4.2) plutot que de reparser `weeks` : `battlesByWeek`
 * y est deja aligne sur `weeks` (la plus recente en index 0).
 *
 * Un membre sans historique complet sur les 5 dernieres semaines (arrive
 * recemment, ou moins de 5 semaines connues au total) n'est pas evalue
 * plutot que juge sur des donnees partielles - meme philosophie que
 * `findMeritoriousMembers` (US 7). Un ex-membre present dans le log mais
 * absent de `members` est exclu de facto (on ne parcourt que `members`).
 */
export function computeConsistencyTrends(
  members: readonly ClanMember[],
  weeks: WarWeek[],
): MemberConsistencyTrend[] {
  const attendanceByTag = new Map(
    computeAttendance(weeks).map((entry) => [entry.tag, entry]),
  );

  const trends: MemberConsistencyTrend[] = [];
  for (const member of members) {
    const recentWeeks = attendanceByTag
      .get(member.tag)
      ?.battlesByWeek.slice(0, CONSISTENCY_WEEKS);
    if (recentWeeks === undefined || recentWeeks.length < CONSISTENCY_WEEKS) {
      continue;
    }
    if (recentWeeks.some((value) => value === null)) {
      continue;
    }

    const weeklyValues = [...recentWeeks].reverse() as number[];
    const average =
      weeklyValues.reduce((sum, value) => sum + value, 0) / CONSISTENCY_WEEKS;
    const slope = computeLinearRegressionSlope(weeklyValues);
    trends.push({
      tag: member.tag,
      name: member.name,
      weeklyValues,
      average,
      slope,
      profile: classifyConsistencyTrend(average, slope),
    });
  }
  return trends;
}

/**
 * Rang d'urgence managerial (US 12) : les profils qui appellent une
 * action (chute en cours, engagement chroniquement faible) d'abord, les
 * profils sains en dernier.
 */
const PROFILE_URGENCY_RANK: Record<ConsistencyProfile, number> = {
  decrocheur: 0,
  touriste: 1,
  irregulier: 2,
  redemption: 3,
  roc: 4,
};

/**
 * Trie par urgence decroissante (Decrocheur puis Touriste en tete, Le
 * Roc en dernier), tie-break nom puis tag. Sans mutation de l'entree,
 * meme convention que `sortMembers` (US 3.2).
 */
export function sortConsistencyTrends(
  trends: readonly MemberConsistencyTrend[],
): MemberConsistencyTrend[] {
  return [...trends].sort((a, b) => {
    const rankDiff = PROFILE_URGENCY_RANK[a.profile] - PROFILE_URGENCY_RANK[b.profile];
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag);
  });
}
