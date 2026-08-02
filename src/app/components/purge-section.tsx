'use client';

/**
 * Vue de renvoi (US 5.1) : filtre « A expulser » combinant 0 don et
 * moins de X combats de guerre, avec seuil X configurable et motif
 * d'inclusion affiche pour chaque joueur.
 */

import { useMemo, useState } from 'react';
import type { ClanMember } from '@/domain/clan/members';
import { findPurgeCandidates, PURGE_REASON_LABELS } from '@/domain/clan/purge';
import type { PlayerAttendance } from '@/domain/war/war-history';

const DEFAULT_MIN_WAR_BATTLES = 8;

interface PurgeSectionProps {
  members: readonly ClanMember[];
  attendance: readonly PlayerAttendance[];
  /** Vrai quand membres ET historique sont charges. */
  ready: boolean;
}

export function PurgeSection({ members, attendance, ready }: PurgeSectionProps) {
  const [minWarBattles, setMinWarBattles] = useState(DEFAULT_MIN_WAR_BATTLES);

  const candidates = useMemo(
    () => findPurgeCandidates(members, attendance, { minWarBattles }),
    [members, attendance, minWarBattles],
  );

  if (!ready) {
    return null;
  }

  return (
    <section aria-labelledby="purge-title" className="space-y-4">
      <h2
        id="purge-title"
        className="text-royale-parchment font-display text-xl tracking-wide"
      >
        A expulser
      </h2>

      <p className="text-royale-parchment-dim text-sm">
        Joueurs cumulant zero don et moins de
        <label className="mx-2 inline-flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={999}
            value={minWarBattles}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              setMinWarBattles(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
            }}
            aria-label="Seuil de combats de guerre"
            className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment w-16 rounded-md border px-2 py-1 text-right"
          />
        </label>
        combats de guerre sur la periode connue.
      </p>

      {candidates.length === 0 ? (
        <p className="text-royale-green-500">
          Aucun joueur problematique avec ces criteres.
        </p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((candidate) => (
            <li
              key={candidate.member.tag}
              data-testid="purge-row"
              className="border-royale-red-700/60 bg-royale-navy-900 flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3"
            >
              <div>
                <p className="text-royale-parchment font-semibold">
                  {candidate.member.name}
                  <span className="text-royale-parchment-dim ml-2 text-xs">
                    {candidate.member.tag}
                  </span>
                </p>
                <p className="text-royale-parchment-dim text-xs">
                  {candidate.totalWarBattles === null
                    ? 'Jamais vu en guerre'
                    : `${candidate.totalWarBattles} combats sur la periode`}
                  {' · '}
                  {candidate.member.donations} dons
                </p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {candidate.reasons.map((reason) => (
                  <li
                    key={reason}
                    className="bg-royale-red-700 text-royale-parchment rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {PURGE_REASON_LABELS[reason]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
