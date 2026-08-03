'use client';

/**
 * Historique des guerres passees (US 13.6, Epique 13) : tableau
 * d'assiduite croise joueurs x semaines. A besoin du clan (US 13.2) pour
 * connaitre les membres actuels et exclure les joueurs partis du tableau
 * (`filterCurrentMembers`, deja dans `WarHistorySection`).
 */

import { useMemo } from 'react';
import { toApiTagSegment } from '@/domain/clan/clan-tag';
import { parseClanMembers } from '@/domain/clan/members';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ServerResourceResult } from '@/lib/server-clan-resource';
import { ClanStatusMessage } from '../components/clan/clan-status-message';
import { WarHistorySection } from '../components/war-history-section';

interface HistoriqueViewProps {
  tag: string;
  clanSeed: ServerResourceResult<unknown>;
  logSeed?: ServerResourceResult<unknown>;
}

export function HistoriqueView({ tag, clanSeed, logSeed }: HistoriqueViewProps) {
  const clanPath = `/api/clans/${toApiTagSegment(tag)}`;
  const clanState = useApiResource<unknown>(clanPath, clanSeed);
  const clanConfirmed = clanState.status === 'success';
  const logState = useApiResource<unknown>(
    clanConfirmed ? `${clanPath}/riverracelog` : null,
    logSeed,
  );

  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const memberTags = useMemo(() => members.map((member) => member.tag), [members]);

  return (
    <div className="space-y-10">
      <ClanStatusMessage
        state={clanState}
        idleMessage="Saisissez le tag ou le nom de votre clan pour afficher son historique."
      />

      {clanState.status === 'success' && (
        <WarHistorySection
          logState={logState}
          clanTag={tag}
          currentMemberTags={memberTags}
        />
      )}
    </div>
  );
}
