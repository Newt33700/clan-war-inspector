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
import { Accordion } from './accordion';
import { CopyButton } from './copy-button';
import { EmptyState } from './empty-state';
import { PlayerTagButton } from './player-tag-button';
import { Skeleton } from './skeleton';
import { useTranslations } from './i18n/locale-provider';

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
  const { t } = useTranslations();
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
        className="cr-wood-header text-cr-title font-display rounded-lg text-xl tracking-wide"
      >
        {t('hrAssistant.title')}
      </h2>

      {!ready ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-32 w-full" label={t('hrAssistant.loadingLabel')} />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-royale-parchment-dim text-sm font-semibold tracking-wide uppercase">
                {t('hrAssistant.meritorious')}
              </h3>
              {meritorious.length > 0 && (
                <CopyButton
                  text={formatMeritoriousForClipboard(meritorious)}
                  label={t('hrAssistant.copyRecommendations')}
                />
              )}
            </div>
            {meritorious.length === 0 ? (
              <EmptyState
                icon={<ShieldIcon className="h-10 w-10" />}
                title={t('hrAssistant.noMeritoriousTitle')}
                description={t('hrAssistant.noMeritoriousDescription')}
              />
            ) : (
              <div className="bg-cr-panel-light rounded-lg border-2 border-black p-3">
                <ul className="space-y-3">
                  {meritorious.map((member, index) => (
                    <li
                      key={member.tag}
                      data-testid="merit-card"
                      style={{ animationDelay: `${index * 60}ms` }}
                      className="animate-fade-in cr-pill-row border-l-cr-green border-l-4 p-4"
                    >
                      <Accordion
                        summary={
                          <>
                            <ShieldIcon className="text-cr-green h-8 w-8 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-display truncate font-bold text-slate-900">
                                {member.name}
                              </p>
                              <span className="bg-cr-green mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
                                {t('hrAssistant.promotionSuggested')}
                              </span>
                            </div>
                          </>
                        }
                        detailClassName="space-y-2 pt-3"
                      >
                        <PlayerTagButton
                          tag={member.tag}
                          className="block text-xs text-slate-500"
                        >
                          {member.tag}
                        </PlayerTagButton>
                        <CopyButton text={member.tag} />
                      </Accordion>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-royale-parchment-dim text-sm font-semibold tracking-wide uppercase">
                {t('hrAssistant.onWatch')}
              </h3>
              {onWatch.length > 0 && (
                <CopyButton
                  text={formatWatchlistForClipboard(onWatch)}
                  label={t('hrAssistant.copyRecommendations')}
                />
              )}
            </div>
            {onWatch.length === 0 ? (
              <EmptyState
                icon={<TriangleWarningIcon className="h-10 w-10" />}
                title={t('hrAssistant.noWatchTitle')}
                description={
                  war?.isTrainingDay
                    ? t('hrAssistant.noWatchTrainingDescription')
                    : t('hrAssistant.noWatchDescription', { threshold: minWeeklyBattles })
                }
              />
            ) : (
              <div className="bg-cr-panel-light rounded-lg border-2 border-black p-3">
                <ul className="space-y-3">
                  {onWatch.map((candidate, index) => (
                    <li
                      key={candidate.member.tag}
                      data-testid="watch-card"
                      style={{ animationDelay: `${index * 60}ms` }}
                      className="animate-fade-in cr-pill-row border-l-cr-red border-l-4 p-4"
                    >
                      <Accordion
                        summary={
                          <>
                            <TriangleWarningIcon className="text-cr-red h-8 w-8 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-display truncate font-bold text-slate-900">
                                {candidate.member.name}
                              </p>
                              <p className="text-cr-red text-sm font-semibold">
                                {t('hrAssistant.demotionSuggested')}
                              </p>
                              <p className="text-xs text-slate-500">
                                {t('hrAssistant.battlesThisWeek', {
                                  count: candidate.currentWeekBattles,
                                })}
                              </p>
                            </div>
                          </>
                        }
                        detailClassName="space-y-2 pt-3"
                      >
                        <PlayerTagButton
                          tag={candidate.member.tag}
                          className="block text-xs text-slate-500"
                        >
                          {candidate.member.tag}
                        </PlayerTagButton>
                        <CopyButton text={candidate.member.tag} />
                      </Accordion>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
