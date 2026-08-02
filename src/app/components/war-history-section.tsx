'use client';

/**
 * Historique d'assiduite aux guerres (US 4.3) avec alertes visuelles
 * (US 4.4) : joueurs en lignes, semaines en colonnes, valeur n/16.
 * La distinction « 0 combat » / « non membre cette semaine-la » est
 * explicite, et l'alerte n'est jamais portee par la seule couleur.
 */

import { useMemo } from 'react';
import {
  classifyBattleCount,
  LEVEL_LABELS,
  LEVEL_SYMBOLS,
  type AttendanceLevel,
} from '@/domain/war/attendance-level';
import {
  BATTLES_PER_WAR_WEEK,
  buildClanWarHistory,
  type WarWeek,
} from '@/domain/war/war-history';
import type { ApiResourceState } from '@/hooks/use-api-resource';

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
  logState: ApiResourceState<unknown>;
  clanTag: string;
}

export function WarHistorySection({ logState, clanTag }: WarHistorySectionProps) {
  const history = useMemo(
    () =>
      logState.status === 'success' ? buildClanWarHistory(logState.data, clanTag) : null,
    [logState, clanTag],
  );

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
        <p role="alert" className="text-royale-red-500">
          {logState.message}
        </p>
      )}

      {history !== null &&
        (history.weeks.length === 0 ? (
          <p className="text-royale-parchment-dim">
            Aucun historique de guerre disponible pour ce clan.
          </p>
        ) : (
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
                    <th key={week.weekId} scope="col" className="px-3 py-2">
                      {weekLabel(week)}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.players.map((player) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
