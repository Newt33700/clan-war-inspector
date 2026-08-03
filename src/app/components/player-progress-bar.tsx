/**
 * Jauge de progression d'assiduite (US 12.1) : remplace un texte brut
 * "7/16" par une barre coloree, partagee par l'historique et par Guerre
 * en cours plutot que dupliquee dans chaque tableau.
 *
 * Purement presentationnel (aucun etat, aucun effet) : pas de directive
 * 'use client' necessaire ici. Les deux appelants actuels sont eux-memes
 * des Client Components (tris, scroll), donc ce composant est bundle cote
 * client dans cette app - mais rien ne l'empeche d'etre rendu depuis un
 * vrai Server Component si l'architecture evolue.
 */

import {
  classifyBattleCount,
  LEVEL_LABELS,
  LEVEL_SYMBOLS,
  type AttendanceLevel,
} from '@/domain/war/attendance-level';
import { BATTLES_PER_WAR_WEEK } from '@/domain/war/war-history';

/** Couleurs partagees : reutilisees par la legende de l'historique. */
export const LEVEL_TEXT_CLASSES: Record<AttendanceLevel, string> = {
  complete: 'text-royale-green-500',
  warning: 'text-orange-400',
  critical: 'text-royale-red-500',
};

const LEVEL_BAR_CLASSES: Record<AttendanceLevel, string> = {
  complete: 'bg-royale-green-500',
  warning: 'bg-orange-400',
  critical: 'bg-royale-red-500',
};

interface PlayerProgressBarProps {
  score: number;
  /**
   * Valeur maximale de la jauge (16 combats de guerre par defaut).
   * N'affecte que le remplissage visuel : la couleur reste classee sur
   * l'echelle hebdomadaire (`classifyBattleCount`, 0-16), seul usage
   * actuel de ce composant.
   */
  max?: number;
}

export function PlayerProgressBar({
  score,
  max = BATTLES_PER_WAR_WEEK,
}: PlayerProgressBarProps) {
  const level = classifyBattleCount(score);
  return (
    <div
      aria-label={`${score} combats sur ${max}, ${LEVEL_LABELS[level]}`}
      className="flex flex-col items-center gap-1"
    >
      <span className={`text-sm font-semibold tabular-nums ${LEVEL_TEXT_CLASSES[level]}`}>
        {score}/{max}
        <span aria-hidden="true"> {LEVEL_SYMBOLS[level]}</span>
      </span>
      <span
        aria-hidden="true"
        className="bg-royale-navy-950 block h-1.5 w-full min-w-16 overflow-hidden rounded-full"
      >
        <span
          data-testid="battle-gauge"
          className={`block h-full ${LEVEL_BAR_CLASSES[level]}`}
          style={{ width: `${Math.min(100, (score / max) * 100)}%` }}
        />
      </span>
    </div>
  );
}
