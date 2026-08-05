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
import { ActionButton } from './action-button';
import { PlayerProgressBar } from './player-progress-bar';
import { PlayerTagButton } from './player-tag-button';
import { SwordsIcon } from './section-icons';
import { Skeleton } from './skeleton';
import { useTranslations } from './i18n/locale-provider';

interface CurrentWarSectionProps {
  /** Etat du chargement de /currentriverrace, pilote par le dashboard. */
  warState: ApiResource<unknown>;
  /** Tags des membres actuels, pour reperer les partis en cours de guerre. */
  memberTags: readonly string[];
}

function WarParticipantCard({
  participant,
  t,
}: {
  participant: AnnotatedWarParticipant;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const idleToday = participant.decksUsedToday === 0;
  return (
    <li
      data-testid="war-card"
      className={`cr-pill-row space-y-3 p-4 ${participant.stillInClan ? '' : 'opacity-50'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <PlayerTagButton tag={participant.tag} className="block">
            <p className="font-display font-semibold text-slate-900">
              {participant.name}
            </p>
            <p className="text-xs text-slate-500">{participant.tag}</p>
          </PlayerTagButton>
          {!participant.stillInClan && (
            <span className="bg-cr-red mt-1 inline-block rounded px-2 py-0.5 text-xs text-white">
              {t('currentWar.leftClan')}
            </span>
          )}
        </div>
        <p
          className={`text-right text-sm font-semibold tabular-nums ${
            idleToday ? 'text-cr-red' : 'text-slate-900'
          }`}
        >
          {participant.decksUsedToday}/{DECKS_PER_DAY}
          <span className="block text-xs font-normal text-slate-500">
            {t('currentWar.today')}
          </span>
          {idleToday && <span className="sr-only">{t('currentWar.idleTodaySr')}</span>}
        </p>
      </div>
      <PlayerProgressBar score={participant.decksUsed} max={BATTLES_PER_WAR_WEEK} />
    </li>
  );
}

function periodBadge(
  isTrainingDay: boolean,
  periodType: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (isTrainingDay) {
    return (
      <span className="bg-royale-blue-800 rounded-full px-3 py-1 text-xs font-semibold text-white uppercase">
        {t('currentWar.trainingDay')}
      </span>
    );
  }
  if (periodType === 'unknown') {
    return null;
  }
  return (
    <span className="bg-royale-red-700 rounded-full px-3 py-1 text-xs font-semibold text-white uppercase">
      {t('currentWar.battleDay')}
    </span>
  );
}

export function CurrentWarSection({ warState, memberTags }: CurrentWarSectionProps) {
  const { t } = useTranslations();
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
      <h2
        id="current-war-title"
        className="cr-wood-header text-cr-title font-display rounded-lg text-xl tracking-wide"
      >
        <SwordsIcon className="h-5 w-5" />
        {t('currentWar.title')}
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        {war !== null && periodBadge(war.isTrainingDay, war.periodType, t)}
        {updatedAt !== null && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-royale-parchment-dim text-xs">
              {t('currentWar.updatedAt', { time: formatTimeOfDay(updatedAt) })}
            </span>
            <ActionButton
              onClick={warState.refetch}
              disabled={warState.status === 'loading'}
              variant="blue"
              className="px-3 py-1 text-xs"
            >
              {t('currentWar.refresh')}
            </ActionButton>
          </div>
        )}
      </div>

      {warState.status === 'loading' && (
        <div
          role="status"
          aria-label={t('currentWar.loadingLabel')}
          className="space-y-2"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {warState.status === 'error' && (
        <div className="space-y-2">
          <p role="alert" className="text-royale-red-700">
            {warState.message}
          </p>
          <button
            type="button"
            onClick={warState.refetch}
            className="btn-cr-red px-3 py-1 text-sm"
          >
            {t('common.retry')}
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
          {t('currentWar.showFormerMembers', { count: formerMemberCount })}
        </label>
      )}

      {war !== null &&
        (war.state === 'notInWar' || allParticipants.length === 0 ? (
          <p className="text-royale-parchment-dim">{t('currentWar.notInWar')}</p>
        ) : participants.length === 0 ? (
          <p className="text-royale-parchment-dim">{t('currentWar.noParticipants')}</p>
        ) : (
          <div className="bg-cr-panel-light space-y-3 rounded-lg border-2 border-black p-3">
            {/* Vue carte mobile (US 14.2) : le tableau reste reserve a
                partir de `md` (souris/trackpad). */}
            <ul className="space-y-3 md:hidden">
              {participants.map((participant) => (
                <WarParticipantCard
                  key={participant.tag}
                  participant={participant}
                  t={t}
                />
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-separate border-spacing-y-2 text-sm">
                <caption className="sr-only">{t('currentWar.tableCaption')}</caption>
                <thead>
                  <tr className="uppercase">
                    <th scope="col" className="px-3 py-2 text-left text-slate-600">
                      {t('currentWar.colPlayer')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-slate-600">
                      {t('currentWar.colToday')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-slate-600">
                      {t('currentWar.colWeek')}
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
                        className={`bg-gradient-to-b from-white to-slate-100 text-slate-900 ${
                          participant.stillInClan ? '' : 'opacity-50'
                        }`}
                      >
                        <th
                          scope="row"
                          className="rounded-l-xl border-y-2 border-l-2 border-black px-3 py-2 text-left font-normal"
                        >
                          <PlayerTagButton tag={participant.tag} className="font-display">
                            {participant.name}
                            <span className="block text-xs font-normal text-slate-500">
                              {participant.tag}
                            </span>
                          </PlayerTagButton>
                          {!participant.stillInClan && (
                            <span className="bg-cr-red mt-1 inline-block rounded px-2 py-0.5 text-xs text-white">
                              {t('currentWar.leftClan')}
                            </span>
                          )}
                        </th>
                        <td
                          className={`border-y-2 border-black px-3 py-2 text-right font-semibold tabular-nums ${
                            idleToday ? 'text-cr-red' : 'text-slate-900'
                          }`}
                        >
                          {participant.decksUsedToday}/{DECKS_PER_DAY}
                          {idleToday && (
                            <span className="sr-only">{t('currentWar.idleTodaySr')}</span>
                          )}
                        </td>
                        <td className="rounded-r-xl border-y-2 border-r-2 border-black px-3 py-2">
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
          </div>
        ))}
    </section>
  );
}
