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

/**
 * Icone de trophee reelle (retour utilisateur 2026-08-04, inspiration
 * StatsRoyale) : meme CDN communautaire deja utilise pour l'icone de dons
 * (`player-accordion-item.tsx`), pas d'asset officiel Supercell equivalent.
 */
const TROPHY_ICON_URL = 'https://cdn.royaleapi.com/static/img/ui/trophy.png';

interface ClanHeaderProps {
  summary: ClanSummary;
}

function TrophyPill({
  value,
  ariaLabel,
  tone,
}: {
  value: number;
  ariaLabel: string;
  tone: 'score' | 'war';
}) {
  return (
    <span
      aria-label={ariaLabel}
      className="border-royale-gold-400/50 flex items-center gap-1.5 rounded-full border bg-black/25 px-2.5 py-1"
    >
      <img
        src={TROPHY_ICON_URL}
        alt=""
        aria-hidden="true"
        className="h-4 w-4"
        style={
          tone === 'war' ? { filter: 'hue-rotate(220deg) saturate(1.6)' } : undefined
        }
      />
      <span aria-hidden="true" className="text-sm font-semibold text-white tabular-nums">
        {value}
      </span>
    </span>
  );
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
          width={80}
          height={80}
          className="h-20 w-20 object-contain drop-shadow-md"
          aria-hidden="true"
        />
      )}
      <div className="space-y-1.5">
        <p className="text-cr-title font-display text-lg tracking-wide">
          {summary.name}
          <span className="ml-2 text-sm font-normal text-slate-200">{summary.tag}</span>
        </p>
        <p className="text-sm text-slate-200">
          {t('clanHeader.memberCount', {
            count: summary.memberCount,
            max: CLAN_MAX_MEMBERS,
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <TrophyPill
            value={summary.clanScore}
            ariaLabel={t('clanHeader.scoreAriaLabel', { score: summary.clanScore })}
            tone="score"
          />
          <TrophyPill
            value={summary.warTrophies}
            ariaLabel={t('clanHeader.warTrophiesAriaLabel', {
              trophies: summary.warTrophies,
            })}
            tone="war"
          />
        </div>
      </div>
    </div>
  );
}
