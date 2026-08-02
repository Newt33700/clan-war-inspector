/**
 * Serialisation de la liste "A expulser" pour le presse-papiers (US 6.6) :
 * partage rapide avec les autres co-chefs (Discord, etc.) sans recopier
 * la liste a la main.
 */

import type { PurgeCandidate } from '@/domain/clan/purge';

/** Une ligne "Nom (#TAG) - N combats cette semaine" par candidat. */
export function formatPurgeCandidatesForClipboard(
  candidates: readonly PurgeCandidate[],
): string {
  return candidates
    .map(
      (candidate) =>
        `${candidate.member.name} (${candidate.member.tag}) - ${candidate.currentWeekBattles} combats cette semaine`,
    )
    .join('\n');
}
