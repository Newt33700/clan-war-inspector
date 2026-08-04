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
import { SwordsIcon } from './section-icons';

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

/**
 * Degrade interieur "effet jus" (style barre d'elixir du jeu) applique
 * par-dessus la couleur unie ci-dessus : la couleur unie reste la valeur
 * lue par les tests (classe stable, ex. `bg-royale-red-500`), le degrade
 * n'est qu'un raffinement visuel de `background-image` par-dessus.
 */
const LEVEL_BAR_GRADIENT_CLASSES: Record<AttendanceLevel, string> = {
  complete: 'bg-gradient-to-b from-royale-green-500 to-[#1f8a48]',
  warning: 'bg-gradient-to-b from-orange-400 to-orange-700',
  critical: 'bg-gradient-to-b from-royale-red-500 to-royale-red-700',
};

/** Nombre de blocs visuels de la jauge (les 4 jours de guerre). */
const SEGMENT_COUNT = 4;

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
      <span
        className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${LEVEL_TEXT_CLASSES[level]}`}
      >
        {score}/{max}
        {level === 'critical' ? (
          <SwordsIcon className="h-4 w-4" />
        ) : (
          <span aria-hidden="true">{LEVEL_SYMBOLS[level]}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="bg-royale-navy-950 relative block h-3 w-full min-w-16 overflow-hidden rounded-sm border-2 border-black"
      >
        <span
          data-testid="battle-gauge"
          className={`block h-full ${LEVEL_BAR_CLASSES[level]} ${LEVEL_BAR_GRADIENT_CLASSES[level]}`}
          style={{ width: `${Math.min(100, (score / max) * 100)}%` }}
        />
        {/* Separateurs "4 jours de guerre" (style barre d'elixir) :
            traits noirs epais decoupant la jauge en 4 blocs, purement
            decoratifs par-dessus le remplissage continu. */}
        <span className="pointer-events-none absolute inset-0 flex">
          {Array.from({ length: SEGMENT_COUNT - 1 }, (_, index) => (
            <span key={index} className="h-full flex-1 border-r-2 border-black" />
          ))}
          <span className="h-full flex-1" />
        </span>
      </span>
    </div>
  );
}
