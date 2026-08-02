'use client';

/**
 * Vue de renvoi (US 5.1) : filtre « A expulser » combinant 0 don et
 * moins de X combats de guerre, avec seuil X configurable et motif
 * d'inclusion affiche pour chaque joueur.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ClanMember } from '@/domain/clan/members';
import {
  findPurgeCandidates,
  PURGE_REASON_LABELS,
  type PurgeCombinator,
} from '@/domain/clan/purge';
import { formatPurgeCandidatesForClipboard } from '@/lib/purge-export';
import {
  readStoredPurgeSettings,
  storePurgeSettings,
} from '@/lib/purge-settings-storage';
import type { PlayerAttendance } from '@/domain/war/war-history';

const DEFAULT_MIN_WAR_BATTLES = 8;
const EXPECTED_WEEKLY_BATTLES = 16;
const COPY_CONFIRMATION_MS = 2000;

const COMBINATOR_LABELS: Record<PurgeCombinator, string> = { AND: 'ET', OR: 'OU' };

interface PurgeSectionProps {
  members: readonly ClanMember[];
  attendance: readonly PlayerAttendance[];
  /** Vrai quand membres ET historique sont charges. */
  ready: boolean;
}

export function PurgeSection({ members, attendance, ready }: PurgeSectionProps) {
  // Reglage memorise (US-9, audit UX du 2026-08-02) : le seuil et le
  // combinateur ne doivent pas se reinitialiser a chaque visite.
  const [minWarBattles, setMinWarBattles] = useState(
    () => readStoredPurgeSettings()?.minWarBattles ?? DEFAULT_MIN_WAR_BATTLES,
  );
  const [combinator, setCombinator] = useState<PurgeCombinator>(
    () => readStoredPurgeSettings()?.combinator ?? 'AND',
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    storePurgeSettings({ minWarBattles, combinator });
  }, [minWarBattles, combinator]);

  const candidates = useMemo(
    () => findPurgeCandidates(members, attendance, { minWarBattles, combinator }),
    [members, attendance, minWarBattles, combinator],
  );

  // Confirmation transitoire du bouton copier (US 6.6), nettoyee si on
  // recopie avant la fin du delai ou si le composant se demonte.
  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }
    const timer = setTimeout(() => setCopyState('idle'), COPY_CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [copyState]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatPurgeCandidatesForClipboard(candidates));
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

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

      <p className="text-royale-parchment text-sm font-semibold">
        Regle active : 0 don {COMBINATOR_LABELS[combinator]} moins de {minWarBattles}{' '}
        combats de guerre.
      </p>

      <p className="text-royale-parchment-dim text-sm">
        Joueurs cumulant zero don
        <label className="mx-2 inline-flex items-center gap-1">
          <select
            value={combinator}
            onChange={(event) => setCombinator(event.target.value as PurgeCombinator)}
            aria-label="Combinaison des criteres"
            className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment rounded-md border px-2 py-1"
          >
            <option value="AND">ET</option>
            <option value="OR">OU</option>
          </select>
        </label>
        moins de
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
        combats de guerre sur la periode connue ({EXPECTED_WEEKLY_BATTLES} attendus par
        semaine).
      </p>

      {candidates.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold"
          >
            Copier la liste
          </button>
          {copyState === 'copied' && (
            <span role="status" className="text-royale-green-500 text-sm">
              Liste copiee !
            </span>
          )}
          {copyState === 'error' && (
            <span role="alert" className="text-royale-red-500 text-sm">
              Impossible de copier.
            </span>
          )}
        </div>
      )}

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
