'use client';

/**
 * Mini-courbe SVG pure (US 12, "Consistency Trend") : pas de librairie de
 * graphiques (Recharts, Chart.js...), trop lourd pour une simple
 * miniature d'historique. Purement presentationnel (aucun etat local,
 * aucun effet) : la directive 'use client' vient uniquement de
 * `useTranslations`, comme `player-progress-bar.tsx`.
 */

import { BATTLES_PER_WAR_WEEK } from '@/domain/war/war-history';
import { useTranslations } from './i18n/locale-provider';

interface SparklineProps {
  /** Valeurs a tracer, dans l'ordre chronologique (la plus ancienne en premier). */
  values: readonly number[];
  /** Classe Tailwind `stroke-*` : la couleur porte la classification (US 12). */
  colorClassName: string;
  width?: number;
  height?: number;
  /** Valeur correspondant au haut du graphique (16 combats de guerre par defaut). */
  max?: number;
}

function toPoint(
  value: number,
  index: number,
  stepX: number,
  height: number,
  max: number,
) {
  const clamped = Math.min(max, Math.max(0, value));
  const x = index * stepX;
  const y = height - (clamped / max) * height;
  return `${x},${y}`;
}

export function Sparkline({
  values,
  colorClassName,
  width = 80,
  height = 30,
  max = BATTLES_PER_WAR_WEEK,
}: SparklineProps) {
  const { t } = useTranslations();

  if (values.length === 0) {
    return null;
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((value, index) => toPoint(value, index, stepX, height, max))
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('sparkline.ariaLabel', {
        count: values.length,
        values: values.join(', '),
        max,
      })}
    >
      <polyline
        data-testid="sparkline-line"
        points={points}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClassName}
      />
    </svg>
  );
}
