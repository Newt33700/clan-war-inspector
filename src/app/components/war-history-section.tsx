'use client';

/**
 * Historique d'assiduite aux guerres (US 4.3) avec alertes visuelles
 * (US 4.4) : joueurs en lignes, semaines en colonnes, valeur n/16.
 * La distinction « 0 combat » / « non membre cette semaine-la » est
 * explicite, et l'alerte n'est jamais portee par la seule couleur.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  classifyBattleCount,
  LEVEL_LABELS,
  LEVEL_SYMBOLS,
} from '@/domain/war/attendance-level';
import {
  BATTLES_PER_WAR_WEEK,
  buildClanWarHistory,
  filterCurrentMembers,
  formatWarWeekPeriod,
  sortPlayerAttendance,
  type AttendanceSortKey,
  type PlayerAttendance,
  type WarWeek,
} from '@/domain/war/war-history';
import type { SortDirection } from '@/domain/clan/members';
import type { ApiResource } from '@/hooks/use-api-resource';
import { LEVEL_TEXT_CLASSES, PlayerProgressBar } from './player-progress-bar';
import { Skeleton } from './skeleton';

// Au-dela de ce nombre de semaines, le tableau depasse la largeur visible
// sur la plupart des ecrans : un indice de scroll horizontal est ajoute.
const SCROLL_HINT_MIN_WEEKS = 4;

/** Classe de la premiere colonne fixee (US-11, audit UX du 2026-08-02). */
const STICKY_FIRST_COLUMN_HEADER = 'sticky left-0 z-10 bg-transparent';
const STICKY_FIRST_COLUMN =
  'sticky left-0 z-10 bg-white rounded-l-xl border-y-2 border-l-2 border-black';

/**
 * Nombre de semaines affichees par defaut dans une carte mobile (US 14.1,
 * Epique 14) avant "Voir toutes les semaines" : les semaines les plus
 * recentes sont en tete de `history.weeks` (meme convention que le
 * tableau desktop, toujours visibles sans avoir a faire defiler).
 */
const MOBILE_COLLAPSED_WEEKS = 4;

function HistoryPlayerCard({
  player,
  weeks,
}: {
  player: PlayerAttendance;
  weeks: readonly WarWeek[];
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = weeks.length > MOBILE_COLLAPSED_WEEKS;
  const visibleWeeks = expanded ? weeks : weeks.slice(0, MOBILE_COLLAPSED_WEEKS);

  return (
    <li data-testid="history-card" className="cr-pill-row space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-semibold text-slate-900">{player.name}</p>
          <p className="text-xs text-slate-500">{player.tag}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-semibold text-slate-900 tabular-nums">
            {player.totalBattles} total
          </p>
          <p
            className="font-display text-xs text-slate-500 tabular-nums"
            aria-label={`Moyenne sur ${player.weeksPresent} semaine(s) de presence`}
          >
            {player.averagePerPresentWeek.toFixed(1)} moy.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-4 gap-2 text-center text-xs">
        {visibleWeeks.map((week, index) => {
          const battles = player.battlesByWeek[index] ?? null;
          return (
            <li key={week.weekId} className="space-y-1">
              <span className="block truncate text-slate-500">{weekLabel(week)}</span>
              {battles === null ? (
                <span aria-label="Non membre cette semaine" className="text-slate-400">
                  —
                </span>
              ) : (
                <span
                  className={`font-semibold tabular-nums ${LEVEL_TEXT_CLASSES[classifyBattleCount(battles)]}`}
                >
                  {battles}
                  <span aria-hidden="true">
                    {' '}
                    {LEVEL_SYMBOLS[classifyBattleCount(battles)]}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-cr-blue min-h-11 text-xs font-semibold"
        >
          {expanded ? 'Voir moins de semaines' : 'Voir toutes les semaines'}
        </button>
      )}
    </li>
  );
}

function weekLabel(week: WarWeek): string {
  if (week.seasonId !== null && week.sectionIndex !== null) {
    return `S${week.seasonId} G${week.sectionIndex}`;
  }
  return week.weekId;
}

function BattleCell({ battles }: { battles: number | null }) {
  if (battles === null) {
    return (
      <td className="border-y-2 border-black px-3 py-2 text-center">
        <span aria-label="Non membre cette semaine" className="text-slate-400">
          —
        </span>
      </td>
    );
  }

  return (
    <td className="border-y-2 border-black px-3 py-2">
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

  // Selecteur de tri mobile (US 14.1) : un <select> plutot qu'un clic sur
  // en-tete de colonne, plus adapte au tactile qu'un tableau qu'on ne
  // rend meme plus en dessous de `md`.
  function handleSortSelectChange(value: string) {
    if (value === 'none') {
      setSortKey(null);
      return;
    }
    const [key, dir] = value.split('-') as [AttendanceSortKey, SortDirection];
    setSortKey(key);
    setDirection(dir);
  }

  if (logState.status === 'idle') {
    return null;
  }

  return (
    <section aria-labelledby="war-history-title" className="space-y-4">
      <h2
        id="war-history-title"
        className="cr-wood-header text-cr-title font-display rounded-lg text-xl tracking-wide"
      >
        Historique des guerres
      </h2>

      {logState.status === 'loading' && (
        <div role="status" aria-label="Chargement de l historique" className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {logState.status === 'error' && (
        <div className="space-y-2">
          <p role="alert" className="text-royale-red-700">
            {logState.message}
          </p>
          <button
            type="button"
            onClick={logState.refetch}
            className="btn-cr-gold px-3 py-1 text-sm"
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
            {/* Vue carte mobile (US 14.1) : le tableau, dense et a defilement
                horizontal, est reserve a partir de `md` (souris/trackpad). */}
            <div className="bg-cr-panel-light space-y-3 rounded-lg border-2 border-black p-3 md:hidden">
              <label className="flex flex-col gap-1 text-xs">
                <span className="tracking-wide text-slate-600 uppercase">Trier par</span>
                <select
                  value={sortKey === null ? 'none' : `${sortKey}-${direction}`}
                  onChange={(event) => handleSortSelectChange(event.target.value)}
                  className="min-h-11 rounded-md border border-black bg-white px-3 py-2 text-slate-900"
                >
                  <option value="none">Ordre par defaut</option>
                  <option value="total-desc">Total (decroissant)</option>
                  <option value="total-asc">Total (croissant)</option>
                  <option value="average-desc">Moyenne (decroissante)</option>
                  <option value="average-asc">Moyenne (croissante)</option>
                </select>
              </label>
              <ul className="space-y-3">
                {sortedPlayers.map((player) => (
                  <HistoryPlayerCard
                    key={player.tag}
                    player={player}
                    weeks={history.weeks}
                  />
                ))}
              </ul>
            </div>

            {history.weeks.length > SCROLL_HINT_MIN_WEEKS && (
              <p
                aria-hidden="true"
                className="text-royale-parchment-dim hidden text-right text-xs md:block"
              >
                Faites glisser pour voir plus de semaines →
              </p>
            )}
            <div className="bg-cr-panel-light relative hidden rounded-lg border-2 border-black p-3 md:block">
              {showScrollShadow && (
                <div
                  aria-hidden="true"
                  data-testid="scroll-shadow"
                  className="from-cr-panel-light pointer-events-none absolute inset-y-3 right-3 w-8 bg-gradient-to-l to-transparent"
                />
              )}
              <div ref={scrollRef} onScroll={handleScroll} className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2 text-sm">
                  <caption className="sr-only">
                    Combats joues sur {BATTLES_PER_WAR_WEEK} par joueur et par semaine
                  </caption>
                  <thead>
                    <tr className="uppercase">
                      <th
                        scope="col"
                        className={`px-3 py-2 text-left text-slate-600 ${STICKY_FIRST_COLUMN_HEADER}`}
                      >
                        Joueur
                      </th>
                      {history.weeks.map((week) => (
                        <th
                          key={week.weekId}
                          scope="col"
                          className="px-3 py-2 text-slate-600"
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
                                isActive ? 'text-cr-blue' : 'text-slate-600'
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
                        className="bg-gradient-to-b from-white to-slate-100 text-slate-900"
                      >
                        <th
                          scope="row"
                          className={`px-3 py-2 text-left font-normal ${STICKY_FIRST_COLUMN}`}
                        >
                          {player.name}
                          <span className="block text-xs text-slate-500">
                            {player.tag}
                          </span>
                        </th>
                        {player.battlesByWeek.map((battles, index) => (
                          <BattleCell
                            key={history.weeks[index]?.weekId ?? index}
                            battles={battles}
                          />
                        ))}
                        <td className="font-display border-y-2 border-black px-3 py-2 text-right font-semibold tabular-nums">
                          {player.totalBattles}
                        </td>
                        <td
                          className="font-display rounded-r-xl border-y-2 border-r-2 border-black px-3 py-2 text-right text-slate-500 tabular-nums"
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
