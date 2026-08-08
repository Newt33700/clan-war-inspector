/**
 * Taux de participation hebdomadaire du clan (US 12.4) : combats joues sur
 * combats possibles pour le donut de synthese en tete de dashboard. Les
 * anciens membres inscrits sont exclus du numerateur (combats joues),
 * comme dans Guerre en cours par defaut (US-1/US-3, audit UX du
 * 2026-08-02).
 *
 * Le denominateur (combats possibles) se base sur l'effectif ACTUEL du
 * clan (`memberTags.length`), pas sur les seuls membres deja inscrits a
 * la guerre (retour utilisateur du clan French 4, #QC29VC08, 2026-08-05) :
 * un membre qui rejoint apres le debut de la guerre en cours n'apparait
 * dans `currentriverrace.clan.participants` qu'a la guerre suivante (quirk
 * connu de l'API Supercell), ce qui faisait passer le denominateur sous
 * l'effectif reel (verifie sur ce clan reel : 50 membres actuels mais
 * seuls 49 dans le libelle affiche).
 */

import { annotateWithMembership, type CurrentWarParticipant } from './current-war';
import { BATTLES_PER_WAR_WEEK } from './war-history';

export interface WeeklyParticipation {
  battlesPlayed: number;
  battlesPossible: number;
  /** Ratio dans [0, 1] ; 0 si le clan n'a aucun membre actuel. */
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
  const battlesPossible = memberTags.length * BATTLES_PER_WAR_WEEK;
  return {
    battlesPlayed,
    battlesPossible,
    ratio: battlesPossible === 0 ? 0 : battlesPlayed / battlesPossible,
  };
}
