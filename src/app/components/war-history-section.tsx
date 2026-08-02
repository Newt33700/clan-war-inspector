'use client';

/**
 * Historique d'assiduite aux guerres (US 4.3) avec alertes visuelles
 * (US 4.4) : joueurs en lignes, semaines en colonnes, valeur n/16.
 * La distinction « 0 combat » / « non membre cette semaine-la » est
 * explicite, et l'alerte n'est jamais portee par la seule couleur.
 */

import { useMemo, useState } from 'react';
import {
  classifyBattleCount,
  LEVEL_LABELS,
  LEVEL_SYMBOLS,
  type AttendanceLevel,
} from '@/domain/war/attendance-level';
import {
  BATTLES_PER_WAR_WEEK,
  buildClanWarHistory,
  filterCurrentMembers,
  formatWarWeekPeriod,
  sortPlayerAttendance,
  type AttendanceSortKey,
  type WarWeek,
} from '@/domain/war/war-history';
import type { SortDirection } from '@/domain/clan/members';
import type { ApiResource } from '@/hooks/use-api-resource';

// Au-dela de ce nombre de semaines, le tableau depasse la largeur visible
// sur la plupart des ecrans : un indice de scroll horizontal est ajoute.
const SCROLL_HINT_MIN_WEEKS = 4;

const LEVEL_TEXT_CLASSES: Record<AttendanceLevel, string> = {
  complete: 'text-royale-gold-400',
  warning: 'text-orange-400',
  critical: 'text-royale-red-500',
};

const LEVEL_BAR_CLASSES: Record<AttendanceLevel, string> = {
  complete: 'bg-royale-gold-400',
  warning: 'bg-orange-400',
  critical: 'bg-royale-red-500',
};

function weekLabel(week: WarWeek): string {
  if (week.seasonId !== null && week.sectionIndex !== null) {
    return `S${week.seasonId} G${week.sectionIndex}`;
  }
  return week.weekId;
}

function BattleCell({ battles }: { battles: number | null }) {
  if (battles === null) {
    return (
      <td className="px-3 py-2 text-center">
        <span aria-label="Non membre cette semaine" className="text-royale-parchment-dim">
          —
        </span>
      </td>
    );
  }

  const level = classifyBattleCount(battles);
  return (
    <td className="px-3 py-2">
      <div
        aria-label={`${battles} combats sur ${BATTLES_PER_WAR_WEEK}, ${LEVEL_LABELS[level]}`}
        className="flex flex-col items-center gap-1"
      >
        <span className={`text-sm font-semibold ${LEVEL_TEXT_CLASSES[level]}`}>
          {battles}/{BATTLES_PER_WAR_WEEK}
          <span aria-hidden="true"> {LEVEL_SYMBOLS[level]}</span>
        </span>
        <span
          aria-hidden="true"
          className="bg-royale-navy-950 block h-1.5 w-16 overflow-hidden rounded-full"
        >
          <span
            data-testid="battle-gauge"
            className={`block h-full ${LEVEL_BAR_CLASSES[level]}`}
            style={{ width: `${(battles / BATTLES_PER_WAR_WEEK) * 100}%` }}
          />
        </span>
      </div>
    </td>
  );
}

interface WarHistorySectionProps {
  /** Etat du chargement de /riverracelog, pilote par le dashboard. */
  logState: ApiResource<unknown>;
  clanTag: string;
  /** Tags des membres actuels : les joueurs partis sont exclus du tableau. */
  currentMemberTags: readonly string[];
}

export function WarHistorySection({
  logState,
  clanTag,
  currentMemberTags,
}: WarHistorySectionProps) {
  const [sortKey, setSortKey] = useState<AttendanceSortKey | null>(null);
  const [direction, setDirection] = useState<SortDirection>('asc');

  const history = useMemo(
    () =>
      logState.status === 'success' ? buildClanWarHistory(logState.data, clanTag) : null,
    [logState, clanTag],
  );
  const currentPlayers = useMemo(
    () =>
      history === null ? [] : filterCurrentMembers(history.players, currentMemberTags),
    [history, currentMemberTags],
  );
  const sortedPlayers = useMemo(
    () =>
      sortKey === null
        ? currentPlayers
        : sortPlayerAttendance(currentPlayers, sortKey, direction),
    [currentPlayers, sortKey, direction],
  );

  function handleSortChange(key: AttendanceSortKey) {
    if (key === sortKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setDirection('asc');
  }

  if (logState.status === 'idle') {
    return null;
  }

  return (
    <section aria-labelledby="war-history-title" className="space-y-4">
      <h2
        id="war-history-title"
        className="text-royale-parchment font-display text-xl tracking-wide"
      >
        Historique des guerres
      </h2>

      {logState.status === 'loading' && (
        <p role="status" className="text-royale-parchment-dim">
          Chargement de l historique...
        </p>
      )}

      {logState.status === 'error' && (
        <div className="space-y-2">
          <p role="alert" className="text-royale-red-500">
            {logState.message}
          </p>
          <button
            type="button"
            onClick={logState.refetch}
            className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold"
          >
            Reessayer
          </button>
        </div>
      )}

      {history !== null &&
        (history.weeks.length === 0 ? (
          <p className="text-royale-parchment-dim">
            Aucun historique de guerre disponible pour ce clan.
          </p>
        ) : currentPlayers.length === 0 ? (
          <p className="text-royale-parchment-dim">
            Aucun membre actuel n a d historique de guerre sur cette periode.
          </p>
        ) : (
          <div className="space-y-1">
            {history.weeks.length > SCROLL_HINT_MIN_WEEKS && (
              <p
                aria-hidden="true"
                className="text-royale-parchment-dim text-right text-xs"
              >
                Faites glisser pour voir plus de semaines →
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  Combats joues sur {BATTLES_PER_WAR_WEEK} par joueur et par semaine
                </caption>
                <thead>
                  <tr className="border-royale-blue-800 text-royale-parchment-dim border-b uppercase">
                    <th scope="col" className="px-3 py-2 text-left">
                      Joueur
                    </th>
                    {history.weeks.map((week) => (
                      <th
                        key={week.weekId}
                        scope="col"
                        className="px-3 py-2"
                        title={formatWarWeekPeriod(week.createdDate) ?? undefined}
                      >
                        {weekLabel(week)}
                      </th>
                    ))}
                    {(
                      [
                        { key: 'total' as const, label: 'Total' },
                        { key: 'average' as const, label: 'Moyenne' },
                      ] satisfies { key: AttendanceSortKey; label: string }[]
                    ).map((column) => {
                      const isActive = sortKey === column.key;
                      return (
                        <th
                          key={column.key}
                          scope="col"
                          aria-sort={
                            isActive
                              ? direction === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                          className="p-0 text-right"
                        >
                          <button
                            type="button"
                            onClick={() => handleSortChange(column.key)}
                            className={`w-full px-3 py-2 text-right font-semibold uppercase ${
                              isActive
                                ? 'text-royale-gold-400'
                                : 'text-royale-parchment-dim'
                            }`}
                          >
                            {column.label}
                            <span aria-hidden="true">
                              {isActive ? (direction === 'asc' ? ' ▲' : ' ▼') : ''}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player) => (
                    <tr
                      key={player.tag}
                      data-testid="history-row"
                      className="border-royale-blue-800/40 text-royale-parchment border-b"
                    >
                      <th scope="row" className="px-3 py-2 text-left font-normal">
                        {player.name}
                        <span className="text-royale-parchment-dim block text-xs">
                          {player.tag}
                        </span>
                      </th>
                      {player.battlesByWeek.map((battles, index) => (
                        <BattleCell
                          key={history.weeks[index]?.weekId ?? index}
                          battles={battles}
                        />
                      ))}
                      <td className="px-3 py-2 text-right font-semibold">
                        {player.totalBattles}
                      </td>
                      <td
                        className="text-royale-parchment-dim px-3 py-2 text-right"
                        aria-label={`Moyenne sur ${player.weeksPresent} semaine(s) de presence`}
                      >
                        {player.averagePerPresentWeek.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </section>
  );
}
