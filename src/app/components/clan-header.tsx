/**
 * En-tete d'identite du clan (US 6.1) : confirme visuellement que le tag
 * saisi correspond bien au clan attendu, avant toute decision (expulsion...).
 */

import Image from 'next/image';

import type { ClanSummary } from '@/domain/clan/clan-summary';

const CLAN_MAX_MEMBERS = 50;

interface ClanHeaderProps {
  summary: ClanSummary;
}

export function ClanHeader({ summary }: ClanHeaderProps) {
  return (
    <div
      data-testid="clan-header"
      className="border-royale-gold-400/60 from-royale-purple-700/40 to-royale-navy-900 flex flex-wrap items-center gap-4 rounded-xl border-2 bg-gradient-to-r px-4 py-3 shadow-lg"
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
        <p className="text-royale-parchment font-display text-lg tracking-wide">
          {summary.name}
          <span className="text-royale-parchment-dim ml-2 text-sm font-normal">
            {summary.tag}
          </span>
        </p>
        <p className="text-royale-parchment-dim text-sm">
          {summary.memberCount}/{CLAN_MAX_MEMBERS} membres · Score {summary.clanScore} ·
          Trophees de guerre {summary.warTrophies}
        </p>
      </div>
    </div>
  );
}
