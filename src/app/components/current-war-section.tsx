'use client';

/**
 * Suivi en direct de la guerre en cours (US 4.1) : qui a joue ses 4 decks
 * aujourd'hui, distinction jour d'entrainement / jour de bataille, et
 * signalement des inscrits ayant quitte le clan.
 */

import { useMemo } from 'react';
import {
  annotateWithMembership,
  DECKS_PER_DAY,
  parseCurrentWar,
  sortByUrgency,
} from '@/domain/war/current-war';
import { BATTLES_PER_WAR_WEEK } from '@/domain/war/war-history';
import type { ApiResourceState } from '@/hooks/use-api-resource';

interface CurrentWarSectionProps {
  /** Etat du chargement de /currentriverrace, pilote par le dashboard. */
  warState: ApiResourceState<unknown>;
  /** Tags des membres actuels, pour reperer les partis en cours de guerre. */
  memberTags: readonly string[];
}

function periodBadge(isTrainingDay: boolean, periodType: string) {
  if (isTrainingDay) {
    return (
      <span className="bg-royale-blue-800 text-royale-parchment rounded-full px-3 py-1 text-xs font-semibold uppercase">
        Jour d entrainement
      </span>
    );
  }
  if (periodType === 'unknown') {
    return null;
  }
  return (
    <span className="bg-royale-red-700 text-royale-parchment rounded-full px-3 py-1 text-xs font-semibold uppercase">
      Jour de bataille
    </span>
  );
}

export function CurrentWarSection({ warState, memberTags }: CurrentWarSectionProps) {
  const war = useMemo(
    () => (warState.status === 'success' ? parseCurrentWar(warState.data) : null),
    [warState],
  );
  const participants = useMemo(
    () =>
      war === null
        ? []
        : sortByUrgency(annotateWithMembership(war.participants, memberTags)),
    [war, memberTags],
  );

  if (warState.status === 'idle') {
    return null;
  }

  return (
    <section aria-labelledby="current-war-title" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id="current-war-title"
          className="text-royale-parchment font-display text-xl tracking-wide"
        >
          Guerre en cours
        </h2>
        {war !== null && periodBadge(war.isTrainingDay, war.periodType)}
      </div>

      {warState.status === 'loading' && (
        <p role="status" className="text-royale-parchment-dim">
          Chargement de la guerre en cours...
        </p>
      )}

      {warState.status === 'error' && (
        <p role="alert" className="text-royale-red-500">
          {warState.message}
        </p>
      )}

      {war !== null &&
        (war.state === 'notInWar' || participants.length === 0 ? (
          <p className="text-royale-parchment-dim">
            Le clan n est pas en guerre actuellement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Decks joues aujourd hui et sur la semaine par participant
              </caption>
              <thead>
                <tr className="border-royale-blue-800 text-royale-parchment-dim border-b uppercase">
                  <th scope="col" className="px-3 py-2 text-left">
                    Joueur
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Aujourd hui
                  </th>
                  <th scope="col" className="px-3 py-2 text-right">
                    Semaine
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => {
                  const idleToday = participant.decksUsedToday === 0;
                  return (
                    <tr
                      key={participant.tag}
                      data-testid="war-row"
                      className="border-royale-blue-800/40 text-royale-parchment border-b"
                    >
                      <th scope="row" className="px-3 py-2 text-left font-normal">
                        {participant.name}
                        <span className="text-royale-parchment-dim block text-xs">
                          {participant.tag}
                        </span>
                        {!participant.stillInClan && (
                          <span className="bg-royale-red-700/60 text-royale-parchment mt-1 inline-block rounded px-2 py-0.5 text-xs">
                            A quitte le clan
                          </span>
                        )}
                      </th>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          idleToday ? 'text-royale-red-500' : 'text-royale-parchment'
                        }`}
                      >
                        {participant.decksUsedToday}/{DECKS_PER_DAY}
                        {idleToday && (
                          <span className="sr-only"> - aucun deck joue aujourd hui</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {participant.decksUsed}/{BATTLES_PER_WAR_WEEK}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
