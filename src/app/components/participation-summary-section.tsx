'use client';

/**
 * Resume synthetique de participation (US 12.4) : donut SVG (pas de
 * librairie de charts) du taux de combats joues sur combats possibles de
 * la semaine de guerre en cours, parmi les membres actuels. Compose avec
 * le Hall of Fame (US 8) en tete de dashboard plutot que de le remplacer :
 * les deux affichent des informations complementaires (participation vs
 * classement individuel), voir arbitrage B de l'Epique 12.
 */

import { useMemo } from 'react';
import { parseCurrentWar } from '@/domain/war/current-war';
import { computeWeeklyParticipation } from '@/domain/war/participation';
import type { ApiResource } from '@/hooks/use-api-resource';
import { Skeleton } from './skeleton';
import { useTranslations } from './i18n/locale-provider';

interface ParticipationSummarySectionProps {
  /** Etat du chargement de /currentriverrace, pilote par le dashboard. */
  warState: ApiResource<unknown>;
  /** Tags des membres actuels : seuls eux comptent dans le ratio. */
  memberTags: readonly string[];
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ParticipationSummarySection({
  warState,
  memberTags,
}: ParticipationSummarySectionProps) {
  const { t } = useTranslations();
  const war = useMemo(
    () => (warState.status === 'success' ? parseCurrentWar(warState.data) : null),
    [warState],
  );
  const participation = useMemo(
    () =>
      war === null ? null : computeWeeklyParticipation(war.participants, memberTags),
    [war, memberTags],
  );

  if (warState.status === 'idle' || warState.status === 'error') {
    // L'erreur est deja signalee par Guerre en cours sur la meme ressource :
    // pas de bandeau redondant en tete de page.
    return null;
  }

  return (
    <section aria-labelledby="participation-summary-title" className="space-y-4">
      <h2
        id="participation-summary-title"
        className="cr-wood-header text-cr-title font-display rounded-lg text-xl tracking-wide"
      >
        {t('participation.title')}
      </h2>

      {warState.status === 'loading' || war === null || participation === null ? (
        <div role="status" aria-label={t('participation.loadingLabel')}>
          <Skeleton className="mx-auto h-32 w-32 rounded-full" />
        </div>
      ) : war.state === 'notInWar' ? (
        <p className="text-royale-parchment-dim">{t('participation.notInWar')}</p>
      ) : (
        <ParticipationDonut participation={participation} t={t} />
      )}
    </section>
  );
}

function ParticipationDonut({
  participation,
  t,
}: {
  participation: ReturnType<typeof computeWeeklyParticipation>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const percent = Math.round(participation.ratio * 100);
  const filled = participation.ratio * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg
          viewBox="0 0 100 100"
          className="h-32 w-32 -rotate-90"
          role="img"
          aria-label={t('participation.ariaLabel', {
            percent,
            played: participation.battlesPlayed,
            possible: participation.battlesPossible,
          })}
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            className="stroke-slate-200"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
            className="stroke-royale-gold-400"
          />
        </svg>
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-royale-parchment font-display text-2xl font-bold">
            {percent}%
          </span>
        </div>
      </div>
      <p aria-hidden="true" className="text-royale-parchment-dim text-xs">
        {t('participation.battlesLabel', {
          played: participation.battlesPlayed,
          possible: participation.battlesPossible,
        })}
      </p>
    </div>
  );
}
