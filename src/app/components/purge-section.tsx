'use client';

/**
 * Vue de renvoi « A expulser » (regle produit du 2026-08-02) : membres
 * (role Membre) sous un seuil de combats configurable sur la semaine de
 * guerre en cours. Remplace l'ancienne regle US 5.1 (dons + total sur
 * toutes les semaines connues), devenue quasi inoperante avec plusieurs
 * semaines d'historique.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ClanMember } from '@/domain/clan/members';
import { findPurgeCandidates } from '@/domain/clan/purge';
import { parseCurrentWar } from '@/domain/war/current-war';
import { formatModerationReportForClipboard } from '@/lib/purge-export';
import type { ApiResource } from '@/hooks/use-api-resource';

const COPY_CONFIRMATION_MS = 2000;

interface PurgeSectionProps {
  members: readonly ClanMember[];
  warState: ApiResource<unknown>;
  minWeeklyBattles: number;
  onMinWeeklyBattlesChange: (value: number) => void;
  /** Vrai quand membres ET guerre en cours sont charges. */
  ready: boolean;
}

export function PurgeSection({
  members,
  warState,
  minWeeklyBattles,
  onMinWeeklyBattlesChange,
  ready,
}: PurgeSectionProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const war = useMemo(
    () => (warState.status === 'success' ? parseCurrentWar(warState.data) : null),
    [warState],
  );
  const currentWeekParticipants = war?.participants ?? [];
  const warIsActive =
    war !== null && war.state !== 'notInWar' && currentWeekParticipants.length > 0;

  const candidates = useMemo(
    () => findPurgeCandidates(members, currentWeekParticipants, minWeeklyBattles),
    [members, currentWeekParticipants, minWeeklyBattles],
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
      await navigator.clipboard.writeText(
        formatModerationReportForClipboard(candidates, minWeeklyBattles),
      );
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
        Regle active : role Membre et moins de {minWeeklyBattles} combats sur la semaine
        de guerre en cours.
      </p>

      <p className="text-royale-parchment-dim text-sm">
        Membres ayant joue moins de
        <label className="mx-2 inline-flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={16}
            value={minWeeklyBattles}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              onMinWeeklyBattlesChange(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
            }}
            aria-label="Seuil de combats sur la semaine en cours"
            className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment min-h-11 w-16 rounded-md border px-2 py-2 text-right"
          />
        </label>
        combats sur la semaine de guerre en cours (16 attendus). Ce seuil est aussi
        utilise par l Assistant RH pour la rubrique « Sur la sellette ».
      </p>

      {!warIsActive ? (
        <p className="text-royale-parchment-dim">
          Le clan n est pas en guerre actuellement : rien a evaluer sur la semaine en
          cours.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              disabled={candidates.length === 0}
              className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Copier la liste
            </button>
            {copyState === 'copied' && (
              <span role="status" className="text-royale-green-500 text-sm">
                Copié ! ✅
              </span>
            )}
            {copyState === 'error' && (
              <span role="alert" className="text-royale-red-500 text-sm">
                Impossible de copier.
              </span>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="text-royale-green-500">
              Aucun membre problematique avec ce seuil.
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
                      {candidate.currentWeekBattles}/16 combats cette semaine
                    </p>
                  </div>
                  <span className="bg-royale-red-700 text-royale-parchment rounded-full px-3 py-1 text-xs font-semibold">
                    Combats insuffisants cette semaine
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
