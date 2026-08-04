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
  type ReliabilityLevel,
} from '@/domain/player/reliability';
import { parseRiverRaceLog } from '@/domain/war/war-history';
import {
  useNewMemberReliability,
  type ReliabilityResource,
} from '@/hooks/use-new-member-reliability';
import type { ApiResource } from '@/hooks/use-api-resource';
import { Accordion } from './accordion';
import { CopyButton } from './copy-button';
import { EmptyState } from './empty-state';
import { TrophyIcon } from './section-icons';
import { Skeleton } from './skeleton';
import { useTranslations } from './i18n/locale-provider';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

interface QuarantineSectionProps {
  clanTag: string;
  clanState: ApiResource<unknown>;
  logState: ApiResource<unknown>;
}

const LEVEL_BADGE_CLASSES: Record<ReliabilityLevel, string> = {
  red: 'bg-cr-red text-white',
  orange: 'bg-orange-600 text-white',
  green: 'bg-cr-green text-royale-navy-950',
  unknown: 'bg-slate-500 text-white',
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

function CardSkeleton({ t }: { t: Translate }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" label={t('quarantine.analyzing')} />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

function QuarantineCard({
  member,
  resource,
  t,
}: {
  member: ClanMember;
  resource: ReliabilityResource | undefined;
  t: Translate;
}) {
  const level =
    resource?.status === 'success' ? computeReliabilityLevel(resource.stats) : null;

  return (
    <div data-testid="quarantine-card" className="cr-pill-row space-y-3 p-4">
      {/* Le verdict (badge + kick) et le chargement/l'erreur restent
          visibles sans interaction : c'est la raison d'etre de cette
          section (evaluer un risque au premier coup d'oeil). Seul le
          detail brut (tag, stats) se deplie au tap, comme les autres
          cartes en accordeon. */}
      <Accordion
        summary={
          <>
            <div aria-hidden="true" className="text-slate-500">
              <PlayerIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate font-semibold text-slate-900">
                {member.name}
              </p>
            </div>
            <p className="font-display flex shrink-0 items-center gap-1 text-right font-semibold text-slate-900 tabular-nums">
              <TrophyIcon className="text-cr-gold h-4 w-4" />
              {member.trophies}
            </p>
          </>
        }
        detailClassName="space-y-2 pt-3"
      >
        <p className="text-xs text-slate-500">{member.tag}</p>
        {resource?.status === 'success' && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500 uppercase">
                {t('quarantine.totalBattles')}
              </dt>
              <dd className="font-display font-semibold text-slate-900 tabular-nums">
                {resource.stats.battleCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 uppercase">
                {t('quarantine.clanWarWins')}
              </dt>
              <dd className="font-display font-semibold text-slate-900 tabular-nums">
                {resource.stats.clanWarWins}
              </dd>
            </div>
          </dl>
        )}
      </Accordion>

      {(resource === undefined || resource.status === 'loading') && (
        <CardSkeleton t={t} />
      )}

      {resource?.status === 'error' && (
        <p role="alert" className="text-cr-red text-sm">
          {resource.message}
        </p>
      )}

      {level !== null && (
        <div className="space-y-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${LEVEL_BADGE_CLASSES[level]}`}
          >
            {t(`reliabilityLevels.${level}`)}
          </span>
          {KICKABLE_LEVELS.includes(level) && (
            <CopyButton text={member.tag} label={t('quarantine.copyKick')} />
          )}
        </div>
      )}
    </div>
  );
}

export function QuarantineSection({
  clanTag,
  clanState,
  logState,
}: QuarantineSectionProps) {
  const { t } = useTranslations();
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
        className="cr-wood-header text-cr-title font-display rounded-lg text-xl tracking-wide"
      >
        {t('quarantine.title')}
      </h2>

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" label={t('quarantine.searching')} />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : newMembers.length === 0 ? (
        <EmptyState
          icon={<PlayerIcon />}
          title={t('quarantine.emptyTitle')}
          description={t('quarantine.emptyDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {newMembers.map((member) => (
            <QuarantineCard
              key={member.tag}
              member={member}
              resource={profiles.get(member.tag)}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}
