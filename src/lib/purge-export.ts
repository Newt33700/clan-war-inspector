/**
 * Serialisation de la liste "A expulser" pour le presse-papiers (US 6.6,
 * reformate en message unique de moderation par l'US 12.3) : partage rapide
 * avec les autres co-chefs (Discord, message en jeu) sans recopier la liste
 * a la main.
 */

import type { PurgeCandidate } from '@/domain/clan/purge';

/**
 * Message unique pret a coller listant les joueurs sous le quota (US 12.3).
 * Le seuil affiche est celui reellement actif (`minWeeklyBattles`), pas une
 * valeur en dur, pour rester coherent si l utilisateur l ajuste.
 */
export function formatModerationReportForClipboard(
  candidates: readonly PurgeCandidate[],
  minWeeklyBattles: number,
): string {
  if (candidates.length === 0) {
    return '';
  }
  const names = candidates.map((candidate) => candidate.member.name).join(', ');
  return (
    `⚠️ Mise au point du Clan : Les joueurs suivants n'ont pas respecté le ` +
    `quota de combats cette semaine sur ${minWeeklyBattles} : ${names}. ` +
    `Merci de corriger le tir rapidement !`
  );
}
