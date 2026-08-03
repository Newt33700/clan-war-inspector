/**
 * Taux de participation hebdomadaire du clan (US 12.4) : combats joues sur
 * combats possibles parmi les membres actuels inscrits a la guerre en
 * cours, pour le donut de synthese en tete de dashboard. Les anciens
 * membres inscrits sont exclus, comme dans Guerre en cours par defaut
 * (US-1/US-3, audit UX du 2026-08-02).
 */

import { annotateWithMembership, type CurrentWarParticipant } from './current-war';
import { BATTLES_PER_WAR_WEEK } from './war-history';

export interface WeeklyParticipation {
  battlesPlayed: number;
  battlesPossible: number;
  /** Ratio dans [0, 1] ; 0 si aucun membre actuel n'est inscrit. */
  ratio: number;
}

export function computeWeeklyParticipation(
  participants: readonly CurrentWarParticipant[],
  memberTags: readonly string[],
): WeeklyParticipation {
  const current = annotateWithMembership(participants, memberTags).filter(
    (participant) => participant.stillInClan,
  );
  const battlesPlayed = current.reduce(
    (sum, participant) => sum + participant.decksUsed,
    0,
  );
  const battlesPossible = current.length * BATTLES_PER_WAR_WEEK;
  return {
    battlesPlayed,
    battlesPossible,
    ratio: battlesPossible === 0 ? 0 : battlesPlayed / battlesPossible,
  };
}
