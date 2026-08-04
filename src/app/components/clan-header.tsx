'use client';

/**
 * En-tete d'identite du clan (US 6.1) : confirme visuellement que le tag
 * saisi correspond bien au clan attendu, avant toute decision (expulsion...).
 *
 * Profite aussi d'avoir le vrai nom du clan pour completer/corriger la
 * memoire de clans recents (`recent-clans-storage.ts`) : une soumission
 * par tag direct ne connait pas le nom au moment de l'appel, ce backfill
 * l'ajoute des que `ClanHeader` s'affiche.
 */

import { useEffect } from 'react';
import Image from 'next/image';

import type { ClanSummary } from '@/domain/clan/clan-summary';
import { rememberRecentClan } from '@/lib/recent-clans-storage';
import { useTranslations } from './i18n/locale-provider';

const CLAN_MAX_MEMBERS = 50;

interface ClanHeaderProps {
  summary: ClanSummary;
}

export function ClanHeader({ summary }: ClanHeaderProps) {
  const { t } = useTranslations();

  useEffect(() => {
    rememberRecentClan(summary.tag, summary.name);
  }, [summary.tag, summary.name]);

  return (
    <div
      data-testid="clan-header"
      className="border-royale-gold-400/60 from-cr-bg-purple to-royale-navy-900 flex flex-wrap items-center gap-4 rounded-xl border-2 bg-gradient-to-r px-4 py-3 shadow-lg"
    >
      {summary.badgeUrl.length > 0 && (
        <Image
          src={summary.badgeUrl}
          alt=""
          width={48}
          height={48}
          className="border-royale-gold-400 h-12 w-12 rounded-full border-2"
          aria-hidden="true"
        />
      )}
      <div>
        <p className="text-cr-title font-display text-lg tracking-wide">
          {summary.name}
          <span className="ml-2 text-sm font-normal text-slate-200">{summary.tag}</span>
        </p>
        <p className="text-sm text-slate-200">
          {t('clanHeader.stats', {
            count: summary.memberCount,
            max: CLAN_MAX_MEMBERS,
            score: summary.clanScore,
            trophies: summary.warTrophies,
          })}
        </p>
      </div>
    </div>
  );
}
