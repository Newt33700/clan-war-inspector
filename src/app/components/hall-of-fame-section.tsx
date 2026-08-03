'use client';

/**
 * "Hall of Fame" (US 8) : podium des 3 meilleures fames de la derniere
 * semaine de guerre complete, en Hero au sommet du dashboard.
 *
 * L'API Supercell n'expose pas de photo de profil joueur : l'avatar est
 * remplace par un badge de rang, comme pour l'icone d'arene de l'US 7.
 */

import { useMemo } from 'react';
import { findWeeklyTopFame, type HallOfFameEntry } from '@/domain/clan/hall-of-fame';
import type { ApiResource } from '@/hooks/use-api-resource';
import { EmptyState } from './empty-state';
import { TrophyIcon } from './section-icons';
import { Skeleton } from './skeleton';

interface HallOfFameSectionProps {
  /** Etat du chargement de /riverracelog, pilote par le dashboard. */
  logState: ApiResource<unknown>;
  clanTag: string;
}

type Rank = 1 | 2 | 3;

const RANK_STYLE: Record<
  Rank,
  { border: string; shadow: string; crown: string; order: string; size: string }
> = {
  1: {
    border: 'border-yellow-400',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    crown: 'text-yellow-400',
    order: 'md:order-2',
    size: 'h-28 w-28 text-3xl',
  },
  2: {
    border: 'border-slate-300',
    shadow: 'shadow-md shadow-slate-400/30',
    crown: 'text-slate-300',
    order: 'md:order-1',
    size: 'h-20 w-20 text-xl',
  },
  3: {
    border: 'border-amber-700',
    shadow: 'shadow-md shadow-amber-800/30',
    crown: 'text-amber-700',
    order: 'md:order-3',
    size: 'h-20 w-20 text-xl',
  },
};

function CrownIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M3 17 2 8l5 3 5-7 5 7 5-3-1 9H3Zm0 2h18v2H3v-2Z" />
    </svg>
  );
}

function PodiumCard({ entry, rank }: { entry: HallOfFameEntry; rank: Rank }) {
  const style = RANK_STYLE[rank];
  return (
    <div
      data-testid="podium-card"
      data-rank={rank}
      className={`animate-fade-in flex flex-col items-center gap-2 transition-transform duration-300 hover:scale-105 ${style.order}`}
    >
      <CrownIcon className={`h-6 w-6 ${style.crown}`} />
      <div
        className={`bg-royale-navy-900 font-display text-royale-gold-400 flex items-center justify-center rounded-full border-4 font-bold ${style.border} ${style.shadow} ${style.size}`}
      >
        {rank}
      </div>
      <p className="text-royale-parchment max-w-[8rem] truncate text-center font-bold">
        {entry.name}
      </p>
      <p className="text-royale-parchment-dim text-xs">{entry.fame} fame</p>
    </div>
  );
}

export function HallOfFameSection({ logState, clanTag }: HallOfFameSectionProps) {
  const top3 = useMemo(
    () =>
      logState.status === 'success' ? findWeeklyTopFame(logState.data, clanTag) : [],
    [logState, clanTag],
  );

  if (logState.status === 'idle' || logState.status === 'error') {
    // L'erreur est deja signalee par WarHistorySection sur la meme
    // ressource : pas de bandeau redondant en tete de page.
    return null;
  }

  return (
    <section aria-labelledby="hall-of-fame-title" className="space-y-4">
      <h2
        id="hall-of-fame-title"
        className="text-royale-parchment font-display flex items-center gap-2 text-xl tracking-wide"
      >
        <TrophyIcon className="text-royale-gold-400 h-5 w-5" />
        Hall of Fame
      </h2>

      {logState.status === 'loading' && (
        <div
          className="flex items-end justify-center gap-6"
          role="status"
          aria-label="Chargement du Hall of Fame"
        >
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      )}

      {logState.status === 'success' &&
        (top3.length === 0 ? (
          <EmptyState
            icon={<CrownIcon className="h-10 w-10" />}
            title="Pas encore de classement"
            description="Revenez a la fin de la semaine de guerre pour voir le podium."
          />
        ) : (
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-center">
            {top3.map((entry, index) => (
              <PodiumCard key={entry.tag} entry={entry} rank={(index + 1) as Rank} />
            ))}
          </div>
        ))}
    </section>
  );
}
