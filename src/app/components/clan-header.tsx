/**
 * En-tete d'identite du clan (US 6.1) : confirme visuellement que le tag
 * saisi correspond bien au clan attendu, avant toute decision (expulsion...).
 */

import type { ClanSummary } from '@/domain/clan/clan-summary';

const CLAN_MAX_MEMBERS = 50;

interface ClanHeaderProps {
  summary: ClanSummary;
}

export function ClanHeader({ summary }: ClanHeaderProps) {
  return (
    <div
      data-testid="clan-header"
      className="border-royale-blue-800 bg-royale-navy-900 flex flex-wrap items-center gap-4 rounded-md border px-4 py-3"
    >
      {summary.badgeUrl.length > 0 && (
        <img src={summary.badgeUrl} alt="" className="h-12 w-12" aria-hidden="true" />
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
