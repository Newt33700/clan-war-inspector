'use client';

/**
 * Assistant "Ressources Humaines" (US 7) : suggere promotions et
 * retrogradations plutot que de faire chercher le chef de clan a la main.
 *
 * L'icone d'arene demandee par la spec n'est pas disponible dans la reponse
 * /clans/{tag} (seul /players/{tag}, US 9, l'expose) : l'appeler pour
 * chaque candidat multiplierait les requetes Supercell (contraire au
 * principe anti-spam de l'US 9). Repli assume sur une icone generique.
 */

import { useMemo } from 'react';
import type { ClanMember } from '@/domain/clan/members';
import { findMeritoriousMembers, findWatchlistMembers } from '@/domain/clan/hr-assistant';
import { parseCurrentWar } from '@/domain/war/current-war';
import type { PlayerAttendance } from '@/domain/war/war-history';
import type { ApiResource } from '@/hooks/use-api-resource';
import {
  formatMeritoriousForClipboard,
  formatWatchlistForClipboard,
} from '@/lib/hr-recommendations-export';
import { CopyButton } from './copy-button';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';

function ShieldIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M12 2 3 5v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V5l-9-3z" />
    </svg>
  );
}

function TriangleWarningIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M12 2 1 21h22L12 2zm-1 7h2v6h-2V9zm0 8h2v2h-2v-2z" />
    </svg>
  );
}

interface HrAssistantSectionProps {
  members: readonly ClanMember[];
  attendance: readonly PlayerAttendance[];
  /**
   * Pilote l'affichage (squelette / contenu / rien). L'historique n'est
   * charge qu'une fois le clan confirme (US 6.3) : son statut reflete
   * deja fidelement "rien soumis", "clan en cours", "pret" ou "en erreur",
   * sans avoir besoin de l'etat du clan en plus.
   */
  logState: ApiResource<unknown>;
  /** Etat de /currentriverrace, pour le critere "semaine en cours". */
  warState: ApiResource<unknown>;
  /** Seuil de combats sur la semaine en cours, partage avec « A expulser ». */
  minWeeklyBattles: number;
}

export function HrAssistantSection({
  members,
  attendance,
  logState,
  warState,
  minWeeklyBattles,
}: HrAssistantSectionProps) {
  const ready = logState.status === 'success';
  const loading = logState.status === 'loading';

  const war = useMemo(
    () => (warState.status === 'success' ? parseCurrentWar(warState.data) : null),
    [warState],
  );
  // Un jour d'entrainement, `decksUsed` vaut 0 pour tout le monde (la
  // semaine de guerre n'a pas encore commence) : evaluer "Sur la
  // sellette" sur cette donnee marquerait tout aine comme a retrograder
  // (verifie sur le clan reel #20J20QG, 2026-08-03).
  const currentWeekParticipants = useMemo(
    () => (war !== null && !war.isTrainingDay ? war.participants : []),
    [war],
  );

  const meritorious = useMemo(
    () => (ready ? findMeritoriousMembers(members, attendance) : []),
    [ready, members, attendance],
  );
  const onWatch = useMemo(
    () =>
      ready
        ? findWatchlistMembers(members, currentWeekParticipants, minWeeklyBattles)
        : [],
    [ready, members, currentWeekParticipants, minWeeklyBattles],
  );

  if (!ready && !loading) {
    // Rien soumis, ou une erreur deja signalee par les sections membres /
    // historique sur les memes ressources : pas de bandeau redondant.
    return null;
  }

  return (
    <section aria-labelledby="hr-assistant-title" className="space-y-4">
      <h2
        id="hr-assistant-title"
        className="text-royale-parchment font-display text-xl tracking-wide"
      >
        Assistant Ressources Humaines
      </h2>

      {!ready ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-32 w-full" label="Chargement de l assistant RH" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-royale-parchment-dim text-sm font-semibold tracking-wide uppercase">
                Meritants
              </h3>
              {meritorious.length > 0 && (
                <CopyButton
                  text={formatMeritoriousForClipboard(meritorious)}
                  label="Copier les recommandations"
                />
              )}
            </div>
            {meritorious.length === 0 ? (
              <EmptyState
                icon={<ShieldIcon className="h-10 w-10" />}
                title="Aucun meritant pour l instant"
                description="16/16 sur 3 semaines et au moins un don cette semaine, pour un membre."
              />
            ) : (
              <ul className="space-y-3">
                {meritorious.map((member, index) => (
                  <li
                    key={member.tag}
                    data-testid="merit-card"
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="animate-fade-in rounded-lg border border-emerald-700/50 bg-gradient-to-r from-emerald-900 to-slate-900 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldIcon className="h-8 w-8 text-emerald-400" />
                      <div>
                        <p className="text-royale-parchment font-bold">{member.name}</p>
                        <p className="text-royale-parchment-dim text-xs">{member.tag}</p>
                      </div>
                    </div>
                    <span className="mt-3 inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      Promotion suggeree : Aine
                    </span>
                    <div className="mt-3">
                      <CopyButton text={member.tag} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-royale-parchment-dim text-sm font-semibold tracking-wide uppercase">
                Sur la sellette
              </h3>
              {onWatch.length > 0 && (
                <CopyButton
                  text={formatWatchlistForClipboard(onWatch)}
                  label="Copier les recommandations"
                />
              )}
            </div>
            {onWatch.length === 0 ? (
              <EmptyState
                icon={<TriangleWarningIcon className="h-10 w-10" />}
                title="Personne sur la sellette"
                description={
                  war?.isTrainingDay
                    ? 'Jour d entrainement : la semaine de guerre n a pas encore commence, rien a evaluer.'
                    : `Aucun aine sous ${minWeeklyBattles}/16 combats sur la semaine de guerre en cours.`
                }
              />
            ) : (
              <ul className="space-y-3">
                {onWatch.map((candidate, index) => (
                  <li
                    key={candidate.member.tag}
                    data-testid="watch-card"
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="animate-fade-in bg-royale-navy-900 border-royale-red-700 rounded-lg border-l-4 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <TriangleWarningIcon className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-royale-parchment font-bold">
                          {candidate.member.name}
                        </p>
                        <p className="text-royale-parchment-dim text-xs">
                          {candidate.member.tag}
                        </p>
                      </div>
                    </div>
                    <p className="text-royale-red-500 mt-3 text-sm font-semibold">
                      Retrogradation conseillee
                    </p>
                    <p className="text-royale-parchment-dim mt-1 text-xs">
                      {candidate.currentWeekBattles}/16 combats cette semaine
                    </p>
                    <div className="mt-3">
                      <CopyButton text={candidate.member.tag} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
