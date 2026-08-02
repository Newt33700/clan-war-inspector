/**
 * Serialisation des recommandations de l'Assistant RH pour le
 * presse-papiers (audit UX du 2026-08-02, US-10) : jusqu'ici, seule la
 * liste "A expulser" (US 6.6) pouvait etre copiee en un clic, obligeant a
 * recopier les meritants et les joueurs sur la sellette a la main.
 */

import type { ClanMember } from '@/domain/clan/members';
import type { WatchCandidate } from '@/domain/clan/hr-assistant';

/** Une ligne "Nom (#TAG) - Promotion suggeree : Aine" par meritant. */
export function formatMeritoriousForClipboard(members: readonly ClanMember[]): string {
  return members
    .map((member) => `${member.name} (${member.tag}) - Promotion suggeree : Aine`)
    .join('\n');
}

/** Une ligne "Nom (#TAG) - N combats cette semaine" par candidat sur la sellette. */
export function formatWatchlistForClipboard(
  candidates: readonly WatchCandidate[],
): string {
  return candidates
    .map(
      (candidate) =>
        `${candidate.member.name} (${candidate.member.tag}) - ${candidate.currentWeekBattles} combats cette semaine`,
    )
    .join('\n');
}
