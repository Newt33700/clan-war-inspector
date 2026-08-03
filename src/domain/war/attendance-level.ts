/**
 * Classification de l'assiduite hebdomadaire (US 4.4, seuil aligne sur
 * `minWeeklyBattles` depuis l'Epique 12 : 8/16, soit 50% des combats
 * possibles - la meme grille que la regle produit "A expulser" / "Sur la
 * sellette" des Epiques 8/11).
 *
 * Code couleur : 16 = vert (complet), 8 a 15 = orange (avertissement),
 * moins de 8 = rouge (critique). L'information n'est jamais portee par la
 * seule couleur : chaque niveau a un libelle et un symbole.
 */

import { BATTLES_PER_WAR_WEEK } from './war-history';

export type AttendanceLevel = 'complete' | 'warning' | 'critical';

/** En dessous de ce seuil (50% de 16), l'assiduite est critique. */
export const WARNING_THRESHOLD = 8;

/** Classe un nombre de combats hebdomadaires (suppose borne [0, 16]). */
export function classifyBattleCount(battles: number): AttendanceLevel {
  if (battles >= BATTLES_PER_WAR_WEEK) {
    return 'complete';
  }
  if (battles >= WARNING_THRESHOLD) {
    return 'warning';
  }
  return 'critical';
}

/** Libelles accessibles : l'information ne repose pas que sur la couleur. */
export const LEVEL_LABELS: Record<AttendanceLevel, string> = {
  complete: 'Complet',
  warning: 'Incomplet',
  critical: 'Critique',
};

/** Symboles textuels affiches a cote de la valeur. */
export const LEVEL_SYMBOLS: Record<AttendanceLevel, string> = {
  complete: '✓',
  warning: '!',
  critical: '✗',
};
