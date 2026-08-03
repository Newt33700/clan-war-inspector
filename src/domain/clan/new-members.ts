/**
 * Detection des nouveaux membres (US 11, "Sas de Quarantaine") : l'API ne
 * fournit aucune date d'arrivee, donc on croise deux sources deja parsees
 * ailleurs dans le domaine plutot que de la deviner.
 *
 * Source A : les membres actuels (`domain/clan/members`).
 * Source B : les `NEW_MEMBER_LOOKBACK_WEEKS` dernieres semaines de
 * `riverracelog` (`domain/war/war-history`), la plus recente en tete
 * (ordre deja garanti par `parseRiverRaceLog`).
 *
 * Un "nouveau membre" est un membre actuel dont le tag n'apparait dans
 * aucune de ces semaines : ni en tant que participant actif, ni meme
 * inscrit avec 0 combat (present = une ligne dans la semaine, quel que
 * soit son score).
 */

import type { ClanMember } from './members';
import type { WarWeek } from '../war/war-history';

/** Nombre de semaines d'historique prises en compte pour la detection. */
export const NEW_MEMBER_LOOKBACK_WEEKS = 3;

/**
 * Membres actuels absents des `NEW_MEMBER_LOOKBACK_WEEKS` dernieres
 * semaines de guerre connues. Un historique de moins de 3 semaines est
 * evalue tel quel (aucune semaine manquante ne disqualifie un vrai
 * nouveau). Ordre d'entree conserve, aucune entree mutee.
 */
export function findNewMembers(
  members: readonly ClanMember[],
  weeks: readonly WarWeek[],
): ClanMember[] {
  const recentWeeks = weeks.slice(0, NEW_MEMBER_LOOKBACK_WEEKS);
  const seenTags = new Set<string>();
  for (const recentWeek of recentWeeks) {
    for (const participant of recentWeek.participants) {
      seenTags.add(participant.tag);
    }
  }
  return members.filter((member) => !seenTags.has(member.tag));
}
