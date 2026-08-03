'use client';

/**
 * "La Meteo du Clan" (US 12, "Consistency Trend") : regarde la tendance
 * des 5 dernieres semaines de chaque membre (regression lineaire simple,
 * `domain/war/consistency-trend.ts`) pour anticiper les baisses
 * d'engagement, plutot que la seule semaine en cours (deja couverte par
 * "Guerre en cours" et l'Assistant RH).
 */

import { useMemo } from 'react';
import { parseClanMembers } from '@/domain/clan/members';
import {
  computeConsistencyTrends,
  CONSISTENCY_PROFILE_LABELS,
  sortConsistencyTrends,
  type ConsistencyProfile,
} from '@/domain/war/consistency-trend';
import { parseRiverRaceLog } from '@/domain/war/war-history';
import type { ApiResource } from '@/hooks/use-api-resource';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { Sparkline } from './sparkline';

interface WeatherSectionProps {
  clanTag: string;
  clanState: ApiResource<unknown>;
  logState: ApiResource<unknown>;
}

/** Couleur du trait Sparkline : porte la classification (US 12). */
const PROFILE_STROKE_CLASSES: Record<ConsistencyProfile, string> = {
  roc: 'stroke-royale-green-500',
  decrocheur: 'stroke-royale-red-500',
  redemption: 'stroke-blue-400',
  touriste: 'stroke-slate-400',
  irregulier: 'stroke-orange-400',
};

/** Badge rouge clignotant pour Le Decrocheur (spec US 12), sobre ailleurs. */
const PROFILE_BADGE_CLASSES: Record<ConsistencyProfile, string> = {
  roc: 'bg-royale-green-500 text-royale-navy-950',
  decrocheur: 'bg-royale-red-700 text-royale-parchment animate-pulse',
  redemption: 'bg-blue-500 text-royale-navy-950',
  touriste: 'bg-slate-600 text-royale-parchment',
  irregulier: 'bg-orange-500 text-royale-navy-950',
};

function WeatherIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current" aria-hidden="true">
      <path d="M6 18a4 4 0 0 1-.4-7.98A5 5 0 0 1 15 8a4.5 4.5 0 0 1 3 8H6Z" />
    </svg>
  );
}

export function WeatherSection({ clanTag, clanState, logState }: WeatherSectionProps) {
  const ready = clanState.status === 'success' && logState.status === 'success';
  const loading = clanState.status === 'loading' || logState.status === 'loading';

  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const weeks = useMemo(
    () =>
      logState.status === 'success' ? parseRiverRaceLog(logState.data, clanTag) : [],
    [logState, clanTag],
  );
  const trends = useMemo(
    () => (ready ? sortConsistencyTrends(computeConsistencyTrends(members, weeks)) : []),
    [ready, members, weeks],
  );

  if (!ready && !loading) {
    return null;
  }

  return (
    <section aria-labelledby="weather-title" className="space-y-4">
      <h2
        id="weather-title"
        className="text-royale-parchment font-display text-xl tracking-wide"
      >
        La Meteo du Clan
      </h2>

      {!ready ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" label="Analyse des tendances..." />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : trends.length === 0 ? (
        <EmptyState
          icon={<WeatherIcon />}
          title="Pas encore assez d historique"
          description="Il faut au moins 5 semaines de guerre completes pour degager une tendance."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Tendance d assiduite des 5 dernieres semaines par joueur
            </caption>
            <thead>
              <tr className="border-royale-blue-800 text-royale-parchment-dim border-b uppercase">
                <th scope="col" className="px-3 py-2 text-left">
                  Joueur
                </th>
                <th scope="col" className="px-3 py-2 text-left">
                  Tendance
                </th>
                <th scope="col" className="px-3 py-2 text-left">
                  Profil
                </th>
              </tr>
            </thead>
            <tbody>
              {trends.map((trend) => (
                <tr
                  key={trend.tag}
                  data-testid="weather-row"
                  className="border-royale-blue-800/40 text-royale-parchment border-b"
                >
                  <td className="px-3 py-2">
                    <p className="font-semibold">{trend.name}</p>
                    <p className="text-royale-parchment-dim text-xs">{trend.tag}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Sparkline
                      values={trend.weeklyValues}
                      colorClassName={PROFILE_STROKE_CLASSES[trend.profile]}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${PROFILE_BADGE_CLASSES[trend.profile]}`}
                    >
                      {CONSISTENCY_PROFILE_LABELS[trend.profile]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
