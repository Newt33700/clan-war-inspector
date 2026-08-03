'use client';

/**
 * Suivi en direct de la guerre en cours (US 4.1) : qui a joue ses 4 decks
 * aujourd'hui, distinction jour d'entrainement / jour de bataille, et
 * signalement des inscrits ayant quitte le clan.
 *
 * Audit UX du 2026-08-02 (US-1/US-3) : sur le clan reel inspecte, 21 des
 * 68 lignes du tableau etaient d'anciens membres, mecaniquement remontes
 * en tete de tri (0/16). Ce tableau est le plus consulte, notamment les
 * jours de guerre : les ex-membres, inactionnables (ni evaluables ni
 * sanctionnables), sont donc masques par defaut plutot que simplement
 * annotes, avec un controle explicite pour les reafficher au besoin.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  annotateWithMembership,
  DECKS_PER_DAY,
  parseCurrentWar,
  sortByUrgency,
  type AnnotatedWarParticipant,
} from '@/domain/war/current-war';
import { BATTLES_PER_WAR_WEEK } from '@/domain/war/war-history';
import type { ApiResource } from '@/hooks/use-api-resource';
import { formatTimeOfDay } from '@/lib/format-time';
import { PlayerProgressBar } from './player-progress-bar';
import { Skeleton } from './skeleton';

interface CurrentWarSectionProps {
  /** Etat du chargement de /currentriverrace, pilote par le dashboard. */
  warState: ApiResource<unknown>;
  /** Tags des membres actuels, pour reperer les partis en cours de guerre. */
  memberTags: readonly string[];
}

function WarParticipantCard({ participant }: { participant: AnnotatedWarParticipant }) {
  const idleToday = participant.decksUsedToday === 0;
  return (
    <li
      data-testid="war-card"
      className={`border-royale-blue-800 bg-royale-navy-900 space-y-3 rounded-lg border p-4 ${
        participant.stillInClan ? '' : 'opacity-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-royale-parchment font-semibold">{participant.name}</p>
          <p className="text-royale-parchment-dim text-xs">{participant.tag}</p>
          {!participant.stillInClan && (
            <span className="bg-royale-red-700/60 text-royale-parchment mt-1 inline-block rounded px-2 py-0.5 text-xs">
              A quitte le clan
            </span>
          )}
        </div>
        <p
          className={`text-right text-sm font-semibold tabular-nums ${
            idleToday ? 'text-royale-red-500' : 'text-royale-parchment'
          }`}
        >
          {participant.decksUsedToday}/{DECKS_PER_DAY}
          <span className="text-royale-parchment-dim block text-xs font-normal">
            Aujourd hui
          </span>
          {idleToday && <span className="sr-only"> - aucun deck joue aujourd hui</span>}
        </p>
      </div>
      <PlayerProgressBar score={participant.decksUsed} max={BATTLES_PER_WAR_WEEK} />
    </li>
  );
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
  // Horodatage de la derniere donnee recue avec succes (US 6.4) : la guerre
  // en cours evolue toute la journee, sans lui rien n'indique la fraicheur
  // de ce qui est affiche.
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => {
    if (warState.status === 'success') {
      setUpdatedAt(new Date());
    }
  }, [warState]);

  // Anciens membres masques par defaut (audit UX du 2026-08-02, US-1/US-3) :
  // desactive a chaque nouveau tag de clan pour ne pas garder un choix
  // pertinent pour un autre clan.
  const [showFormerMembers, setShowFormerMembers] = useState(false);
  useEffect(() => {
    setShowFormerMembers(false);
  }, [memberTags]);

  const war = useMemo(
    () => (warState.status === 'success' ? parseCurrentWar(warState.data) : null),
    [warState],
  );
  const allParticipants = useMemo(
    () =>
      war === null
        ? []
        : sortByUrgency(annotateWithMembership(war.participants, memberTags)),
    [war, memberTags],
  );
  const formerMemberCount = useMemo(
    () => allParticipants.filter((participant) => !participant.stillInClan).length,
    [allParticipants],
  );
  const participants = useMemo(
    () =>
      showFormerMembers
        ? allParticipants
        : allParticipants.filter((participant) => participant.stillInClan),
    [allParticipants, showFormerMembers],
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
        {updatedAt !== null && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-royale-parchment-dim text-xs">
              Mise a jour a {formatTimeOfDay(updatedAt)}
            </span>
            <button
              type="button"
              onClick={warState.refetch}
              disabled={warState.status === 'loading'}
              className="border-royale-blue-800 text-royale-parchment-dim rounded-md border px-3 py-1 text-xs font-semibold disabled:opacity-40"
            >
              Actualiser
            </button>
          </div>
        )}
      </div>

      {warState.status === 'loading' && (
        <div
          role="status"
          aria-label="Chargement de la guerre en cours"
          className="space-y-2"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {warState.status === 'error' && (
        <div className="space-y-2">
          <p role="alert" className="text-royale-red-500">
            {warState.message}
          </p>
          <button
            type="button"
            onClick={warState.refetch}
            className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold"
          >
            Reessayer
          </button>
        </div>
      )}

      {war !== null && formerMemberCount > 0 && (
        <label className="text-royale-parchment-dim inline-flex min-h-11 items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showFormerMembers}
            onChange={(event) => setShowFormerMembers(event.target.checked)}
            className="h-5 w-5"
          />
          Afficher les anciens membres ({formerMemberCount})
        </label>
      )}

      {war !== null &&
        (war.state === 'notInWar' || allParticipants.length === 0 ? (
          <p className="text-royale-parchment-dim">
            Le clan n est pas en guerre actuellement.
          </p>
        ) : participants.length === 0 ? (
          <p className="text-royale-parchment-dim">
            Aucun membre actuel n a participe a cette guerre pour l instant.
          </p>
        ) : (
          <>
            {/* Vue carte mobile (US 14.2) : le tableau reste reserve a
                partir de `md` (souris/trackpad). */}
            <ul className="space-y-3 md:hidden">
              {participants.map((participant) => (
                <WarParticipantCard key={participant.tag} participant={participant} />
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
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
                        className={`border-royale-blue-800/40 text-royale-parchment border-b ${
                          participant.stillInClan ? '' : 'opacity-50'
                        }`}
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
                          className={`px-3 py-2 text-right font-semibold tabular-nums ${
                            idleToday ? 'text-royale-red-500' : 'text-royale-parchment'
                          }`}
                        >
                          {participant.decksUsedToday}/{DECKS_PER_DAY}
                          {idleToday && (
                            <span className="sr-only">
                              {' '}
                              - aucun deck joue aujourd hui
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <PlayerProgressBar
                            score={participant.decksUsed}
                            max={BATTLES_PER_WAR_WEEK}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ))}
    </section>
  );
}
