'use client';

/**
 * Historique d'assiduite aux guerres (US 4.3) avec alertes visuelles
 * (US 4.4) : joueurs en lignes, semaines en colonnes, valeur n/16.
 * La distinction « 0 combat » / « non membre cette semaine-la » est
 * explicite, et l'alerte n'est jamais portee par la seule couleur.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { LEVEL_LABELS, LEVEL_SYMBOLS } from '@/domain/war/attendance-level';
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
import { LEVEL_TEXT_CLASSES, PlayerProgressBar } from './player-progress-bar';

// Au-dela de ce nombre de semaines, le tableau depasse la largeur visible
// sur la plupart des ecrans : un indice de scroll horizontal est ajoute.
const SCROLL_HINT_MIN_WEEKS = 4;

/** Classe de la premiere colonne fixee (US-11, audit UX du 2026-08-02). */
const STICKY_FIRST_COLUMN = 'sticky left-0 z-10 bg-royale-navy-950';

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

  return (
    <td className="px-3 py-2">
      <PlayerProgressBar score={battles} max={BATTLES_PER_WAR_WEEK} />
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

  // Ombre de bord tant qu'il reste des semaines a faire defiler (US-11,
  // audit UX du 2026-08-02) : l'indice texte seul n'est visible qu'en haut
  // du tableau et disparait une fois qu'on a commence a scroller.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollShadow, setShowScrollShadow] = useState(false);

  function updateScrollShadow(node: HTMLDivElement) {
    setShowScrollShadow(node.scrollWidth - node.clientWidth - node.scrollLeft > 1);
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    updateScrollShadow(event.currentTarget);
  }

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

  useEffect(() => {
    if (scrollRef.current !== null) {
      updateScrollShadow(scrollRef.current);
    }
  }, [history, sortedPlayers]);

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
            <ul className="text-royale-parchment-dim flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {(['complete', 'warning', 'critical'] as const).map((level) => (
                <li
                  key={level}
                  className={`flex items-center gap-1 ${LEVEL_TEXT_CLASSES[level]}`}
                >
                  <span aria-hidden="true">{LEVEL_SYMBOLS[level]}</span>
                  {LEVEL_LABELS[level]}
                </li>
              ))}
              <li className="flex items-center gap-1">
                <span aria-hidden="true">—</span>
                Non membre cette semaine-la
              </li>
            </ul>
            {history.weeks.length > SCROLL_HINT_MIN_WEEKS && (
              <p
                aria-hidden="true"
                className="text-royale-parchment-dim text-right text-xs"
              >
                Faites glisser pour voir plus de semaines →
              </p>
            )}
            <div className="relative">
              {showScrollShadow && (
                <div
                  aria-hidden="true"
                  data-testid="scroll-shadow"
                  className="from-royale-navy-950 pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent"
                />
              )}
              <div ref={scrollRef} onScroll={handleScroll} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">
                    Combats joues sur {BATTLES_PER_WAR_WEEK} par joueur et par semaine
                  </caption>
                  <thead>
                    <tr className="border-royale-blue-800 text-royale-parchment-dim border-b uppercase">
                      <th
                        scope="col"
                        className={`px-3 py-2 text-left ${STICKY_FIRST_COLUMN}`}
                      >
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
                        <th
                          scope="row"
                          className={`px-3 py-2 text-left font-normal ${STICKY_FIRST_COLUMN}`}
                        >
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
          </div>
        ))}
    </section>
  );
}
