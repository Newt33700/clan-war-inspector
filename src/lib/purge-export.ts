/**
 * Serialisation de la liste "A expulser" pour le presse-papiers (US 6.6) :
 * partage rapide avec les autres co-chefs (Discord, etc.) sans recopier
 * la liste a la main.
 */

import { PURGE_REASON_LABELS, type PurgeCandidate } from '@/domain/clan/purge';

/** Une ligne "Nom (#TAG) - motif1, motif2" par candidat. */
export function formatPurgeCandidatesForClipboard(
  candidates: readonly PurgeCandidate[],
): string {
  return candidates
    .map((candidate) => {
      const reasons = candidate.reasons.map((reason) => PURGE_REASON_LABELS[reason]);
      return `${candidate.member.name} (${candidate.member.tag}) - ${reasons.join(', ')}`;
    })
    .join('\n');
}
