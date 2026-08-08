/**
 * Suivi en direct de la guerre en cours (US 4.1).
 *
 * Parse la reponse brute de /currentriverrace : etat de la guerre, type de
 * jour (entrainement / bataille), et pour chaque participant les decks
 * joues aujourd'hui (sur 4), sur la semaine (sur 16), et la fame
 * accumulee (Hall of Fame, US 8 -- revise le 2026-08-05 pour refleter la
 * semaine en cours plutot que la derniere semaine complete du log).
 * Parsing pur et defensif, comme le moteur d'historique.
 */

import { canonicalizePlayerTag } from '../clan/player-tag';
import { toSafeCount } from '../shared/numeric';
import { clampCount } from './clamp';
import { BATTLES_PER_WAR_WEEK } from './war-history';

/** Nombre de decks jouables par jour de bataille. */
export const DECKS_PER_DAY = 4;

/** Types de periode connus de l'API Supercell. */
export type WarPeriod = 'training' | 'warDay' | 'colosseum' | 'unknown';

export interface CurrentWarParticipant {
  tag: string;
  name: string;
  /** Decks joues aujourd'hui, borne [0, 4]. */
  decksUsedToday: number;
  /** Decks joues sur la semaine, borne [0, 16]. */
  decksUsed: number;
  /** Fame accumulee sur la semaine de guerre en cours (Hall of Fame, US 8). */
  fame: number;
}

/**
 * Participant enrichi de son appartenance actuelle au clan :
 * un joueur inscrit a la guerre mais parti du clan reste comptabilise
 * et doit etre identifie comme tel (US 4.1).
 */
export interface AnnotatedWarParticipant extends CurrentWarParticipant {
  stillInClan: boolean;
}

export interface CurrentWar {
  /** Etat brut de l'API (`war`, `notInWar`, ...), `null` si absent. */
  state: string | null;
  periodType: WarPeriod;
  /** Vrai si la periode courante est un jour d'entrainement. */
  isTrainingDay: boolean;
  participants: CurrentWarParticipant[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toPeriodType(value: unknown): WarPeriod {
  if (value === 'training' || value === 'warDay' || value === 'colosseum') {
    return value;
  }
  return 'unknown';
}

function parseParticipants(raw: unknown): CurrentWarParticipant[] {
  if (!isRecord(raw) || !Array.isArray(raw.participants)) {
    return [];
  }

  const byTag = new Map<string, CurrentWarParticipant>();
  for (const candidate of raw.participants) {
    if (!isRecord(candidate)) {
      continue;
    }
    const tag = canonicalizePlayerTag(candidate.tag);
    if (tag === null) {
      continue;
    }
    const decksUsedToday = clampCount(candidate.decksUsedToday, DECKS_PER_DAY);
    const decksUsed = clampCount(candidate.decksUsed, BATTLES_PER_WAR_WEEK);
    const fame = toSafeCount(candidate.fame);
    const name =
      typeof candidate.name === 'string' && candidate.name.length > 0
        ? candidate.name
        : tag;

    const existing = byTag.get(tag);
    if (existing === undefined) {
      byTag.set(tag, { tag, name, decksUsedToday, decksUsed, fame });
    } else {
      // Doublon de tag : ne jamais sous-evaluer l'activite du joueur.
      existing.decksUsedToday = Math.max(existing.decksUsedToday, decksUsedToday);
      existing.decksUsed = Math.max(existing.decksUsed, decksUsed);
      existing.fame = Math.max(existing.fame, fame);
    }
  }
  return [...byTag.values()];
}

/** Parse la reponse brute de /currentriverrace. */
export function parseCurrentWar(raw: unknown): CurrentWar {
  if (!isRecord(raw)) {
    return {
      state: null,
      periodType: 'unknown',
      isTrainingDay: false,
      participants: [],
    };
  }

  const periodType = toPeriodType(raw.periodType);
  return {
    state: typeof raw.state === 'string' ? raw.state : null,
    periodType,
    isTrainingDay: periodType === 'training',
    participants: parseParticipants(raw.clan),
  };
}

/**
 * Marque chaque participant selon sa presence dans la liste actuelle des
 * membres du clan. Les tags sont canonicalises des deux cotes.
 */
export function annotateWithMembership(
  participants: readonly CurrentWarParticipant[],
  memberTags: readonly string[],
): AnnotatedWarParticipant[] {
  // Le filtre exclut les tags non canonicalisables : un `null` egare dans
  // le Set serait de toute facon sans effet sur `.has(participant.tag)`
  // (jamais null), mais le typage `string[]` en aval le rend necessaire
  // (mutant Stryker "equivalent" sur ce filtre).
  const currentTags = new Set(
    memberTags
      .map((tag) => canonicalizePlayerTag(tag))
      .filter((tag): tag is string => tag !== null),
  );
  return participants.map((participant) => ({
    ...participant,
    stillInClan: currentTags.has(participant.tag),
  }));
}

/**
 * Ordonne les participants par urgence : d'abord ceux qui n'ont joue
 * aucun deck aujourd'hui, puis par decks du jour croissants, puis par
 * cumul hebdomadaire croissant. Tie-break deterministe nom puis tag.
 */
export function sortByUrgency(
  participants: readonly AnnotatedWarParticipant[],
): AnnotatedWarParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.decksUsedToday !== b.decksUsedToday) {
      return a.decksUsedToday - b.decksUsedToday;
    }
    if (a.decksUsed !== b.decksUsed) {
      return a.decksUsed - b.decksUsed;
    }
    return a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag);
  });
}
