'use client';

/**
 * Vue d'ensemble du clan (US 13.6, Epique 13) : identite, jauge de
 * participation, Hall of Fame, guerre en cours et annuaire des membres.
 * Recoit du Server Component `page.tsx` les donnees deja resolues cote
 * serveur (US 13.2) et ne gere plus que l'interactivite (tri, recherche
 * de membre, panneau joueur) -- exactement le decoupage retenu pour
 * lever le conflit avec l'arbitrage B de l'Epique 12 (arbitrage D).
 */

import { useMemo, useState } from 'react';
import { toApiTagSegment } from '@/domain/clan/clan-tag';
import { parseClanSummary } from '@/domain/clan/clan-summary';
import {
  filterMembersByQuery,
  parseClanMembers,
  sortMembers,
  type MemberSortKey,
  type SortDirection,
} from '@/domain/clan/members';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ServerResourceResult } from '@/lib/server-clan-resource';
import { ClanStatusMessage } from '../components/clan/clan-status-message';
import { ClanHeader } from '../components/clan-header';
import { CurrentWarSection } from '../components/current-war-section';
import { HallOfFameSection } from '../components/hall-of-fame-section';
import { MembersTable } from '../components/members-table';
import { ParticipationSummarySection } from '../components/participation-summary-section';
import { PlayerDrawer } from '../components/player-drawer';
import { MembersIcon } from '../components/section-icons';

interface DashboardViewProps {
  tag: string;
  clanSeed: ServerResourceResult<unknown>;
  warSeed?: ServerResourceResult<unknown>;
  logSeed?: ServerResourceResult<unknown>;
}

export function DashboardView({ tag, clanSeed, warSeed, logSeed }: DashboardViewProps) {
  const clanPath = `/api/clans/${toApiTagSegment(tag)}`;
  const [sortKey, setSortKey] = useState<MemberSortKey>('role');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedPlayerTag, setSelectedPlayerTag] = useState<string | null>(null);

  const clanState = useApiResource<unknown>(clanPath, clanSeed);
  // La guerre en cours et l'historique ne sont charges qu'une fois le clan
  // confirme (US 6.3) : sinon un tag valide mais inexistant declenche des
  // requetes vouees au 404, affichees comme des alertes redondantes.
  const clanConfirmed = clanState.status === 'success';
  const warState = useApiResource<unknown>(
    clanConfirmed ? `${clanPath}/currentriverrace` : null,
    warSeed,
  );
  const logState = useApiResource<unknown>(
    clanConfirmed ? `${clanPath}/riverracelog` : null,
    logSeed,
  );

  const summary = useMemo(
    () => (clanState.status === 'success' ? parseClanSummary(clanState.data) : null),
    [clanState],
  );
  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const sortedMembers = useMemo(
    () => sortMembers(members, sortKey, direction),
    [members, sortKey, direction],
  );
  const visibleMembers = useMemo(
    () => filterMembersByQuery(sortedMembers, memberQuery),
    [sortedMembers, memberQuery],
  );
  const memberTags = useMemo(() => members.map((member) => member.tag), [members]);

  function handleSortChange(key: MemberSortKey) {
    if (key === sortKey) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setDirection('asc');
  }

  // Tri absolu depuis le selecteur mobile (US 14.2) : contrairement a
  // `handleSortChange` (bascule au clic sur un en-tete de colonne), le
  // <select> choisit directement la colonne et le sens.
  function handleSortSelect(key: MemberSortKey, sortDirection: SortDirection) {
    setSortKey(key);
    setDirection(sortDirection);
  }

  return (
    <div className="space-y-10">
      <ClanStatusMessage
        state={clanState}
        idleMessage="Saisissez le tag ou le nom de votre clan pour afficher le dashboard."
      />

      {summary !== null && <ClanHeader summary={summary} />}

      {clanState.status === 'success' && (
        <>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_2fr]">
            <ParticipationSummarySection warState={warState} memberTags={memberTags} />
            <HallOfFameSection logState={logState} clanTag={tag} />
          </div>

          <CurrentWarSection warState={warState} memberTags={memberTags} />

          <section aria-labelledby="dashboard-members-title" className="space-y-6">
            <h2
              id="dashboard-members-title"
              className="cr-wood-header text-cr-title font-display rounded-lg text-xl tracking-wide"
            >
              <MembersIcon className="h-5 w-5" />
              Membres du clan
            </h2>

            {sortedMembers.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-royale-parchment-dim text-sm">
                  Rechercher un membre
                </span>
                <input
                  type="search"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Pseudo ou tag..."
                  className="cr-glass text-royale-parchment w-full max-w-xs px-3 py-2 placeholder:text-slate-400"
                />
              </label>
            )}

            {sortedMembers.length === 0 ? (
              <p className="text-royale-parchment-dim">Ce clan ne compte aucun membre.</p>
            ) : visibleMembers.length === 0 ? (
              <p className="text-royale-parchment-dim">
                Aucun membre ne correspond a « {memberQuery} ».
              </p>
            ) : (
              <MembersTable
                members={visibleMembers}
                sortKey={sortKey}
                direction={direction}
                onSortChange={handleSortChange}
                onSortSelect={handleSortSelect}
                onSelectMember={setSelectedPlayerTag}
              />
            )}
          </section>
        </>
      )}

      <PlayerDrawer tag={selectedPlayerTag} onClose={() => setSelectedPlayerTag(null)} />
    </div>
  );
}
