'use client';

/**
 * "Sas de Quarantaine" (US 11) : isole les membres actuels sans aucun
 * historique de guerre chez nous (croise `domain/clan/new-members` avec
 * les 3 dernieres semaines de riverracelog) et analyse leur profil global
 * (`/players/{tag}`) pour estimer un risque avant qu'ils ne participent a
 * une guerre.
 *
 * Comme pour l'Assistant RH (`hr-assistant-section.tsx`), aucune icone
 * d'avatar n'est disponible dans les reponses Supercell exploitees ici :
 * repli assume sur une icone generique.
 */

import { useMemo } from 'react';
import { findNewMembers } from '@/domain/clan/new-members';
import { parseClanMembers, type ClanMember } from '@/domain/clan/members';
import {
  computeReliabilityLevel,
  RELIABILITY_LABELS,
  type ReliabilityLevel,
} from '@/domain/player/reliability';
import { parseRiverRaceLog } from '@/domain/war/war-history';
import {
  useNewMemberReliability,
  type ReliabilityResource,
} from '@/hooks/use-new-member-reliability';
import type { ApiResource } from '@/hooks/use-api-resource';
import { CopyButton } from './copy-button';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';

interface QuarantineSectionProps {
  clanTag: string;
  clanState: ApiResource<unknown>;
  logState: ApiResource<unknown>;
}

const LEVEL_BADGE_CLASSES: Record<ReliabilityLevel, string> = {
  red: 'bg-royale-red-700 text-royale-parchment',
  orange: 'bg-orange-600 text-royale-parchment',
  green: 'bg-royale-green-500 text-royale-navy-950',
  unknown: 'bg-slate-700 text-royale-parchment',
};

/** Feux justifiant une action de moderation immediate. */
const KICKABLE_LEVELS: readonly ReliabilityLevel[] = ['red', 'orange'];

function PlayerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" label="Analyse du profil en cours..." />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

function QuarantineCard({
  member,
  resource,
}: {
  member: ClanMember;
  resource: ReliabilityResource | undefined;
}) {
  const level =
    resource?.status === 'success' ? computeReliabilityLevel(resource.stats) : null;

  return (
    <div
      data-testid="quarantine-card"
      className="border-royale-blue-800 bg-royale-navy-900 space-y-4 rounded-lg border p-4"
    >
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="text-royale-parchment-dim">
          <PlayerIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-royale-parchment truncate font-semibold">{member.name}</p>
          <p className="text-royale-parchment-dim text-xs">{member.tag}</p>
        </div>
        <p className="text-royale-gold-400 shrink-0 text-right font-semibold tabular-nums">
          {member.trophies}
        </p>
      </div>

      {resource === undefined || resource.status === 'loading' ? (
        <CardSkeleton />
      ) : resource.status === 'error' ? (
        <p role="alert" className="text-royale-red-500 text-sm">
          {resource.message}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-royale-parchment-dim text-xs uppercase">
                Combats totaux
              </dt>
              <dd className="text-royale-parchment font-semibold tabular-nums">
                {resource.stats.battleCount}
              </dd>
            </div>
            <div>
              <dt className="text-royale-parchment-dim text-xs uppercase">
                Victoires GDC (vie)
              </dt>
              <dd className="text-royale-parchment font-semibold tabular-nums">
                {resource.stats.clanWarWins}
              </dd>
            </div>
          </dl>

          {level !== null && (
            <div className="space-y-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${LEVEL_BADGE_CLASSES[level]}`}
              >
                {RELIABILITY_LABELS[level]}
              </span>
              {KICKABLE_LEVELS.includes(level) && (
                <CopyButton text={member.tag} label="Copier Tag pour Kick" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function QuarantineSection({
  clanTag,
  clanState,
  logState,
}: QuarantineSectionProps) {
  const ready = clanState.status === 'success' && logState.status === 'success';
  const loading = clanState.status === 'loading' || logState.status === 'loading';

  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const weeks = useMemo(
    () =>
      logState.status === 'success' ? parseRiverRaceLog(logState.data, clanTag) : [],
    [logState, clanTag],
  );
  const newMembers = useMemo(
    () => (ready ? findNewMembers(members, weeks) : []),
    [ready, members, weeks],
  );
  const newMemberTags = useMemo(
    () => newMembers.map((member) => member.tag),
    [newMembers],
  );
  const profiles = useNewMemberReliability(newMemberTags);

  if (!ready && !loading) {
    return null;
  }

  return (
    <section aria-labelledby="quarantine-title" className="space-y-4">
      <h2
        id="quarantine-title"
        className="text-royale-parchment font-display text-xl tracking-wide"
      >
        Sas de quarantaine
      </h2>

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" label="Recherche des nouveaux membres..." />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : newMembers.length === 0 ? (
        <EmptyState
          icon={<PlayerIcon />}
          title="Aucun nouveau membre"
          description="Tous les membres actuels ont deja un historique de guerre chez nous."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {newMembers.map((member) => (
            <QuarantineCard
              key={member.tag}
              member={member}
              resource={profiles.get(member.tag)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
