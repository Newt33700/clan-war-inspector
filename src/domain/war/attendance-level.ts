/**
 * Classification de l'assiduite hebdomadaire (US 4.4).
 *
 * Code couleur du backlog : 16 = or (complet), 12 a 15 = orange
 * (avertissement), moins de 12 = rouge (critique). L'information n'est
 * jamais portee par la seule couleur : chaque niveau a un libelle et un
 * symbole.
 */

import { BATTLES_PER_WAR_WEEK } from './war-history';

export type AttendanceLevel = 'complete' | 'warning' | 'critical';

/** En dessous de ce seuil, l'assiduite est critique. */
export const WARNING_THRESHOLD = 12;

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
