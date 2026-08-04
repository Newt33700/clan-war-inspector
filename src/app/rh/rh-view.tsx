'use client';

/**
 * Assistant de moderation (US 13.6, Epique 13) : Assistant RH (Meritants /
 * Sur la sellette) et vue de renvoi "A expulser", qui partagent deja le
 * seuil `minWeeklyBattles` (Epique 11) -- ce partage doit rester possible
 * une fois les deux composants reunis sur la meme page.
 */

import { useEffect, useMemo, useState } from 'react';
import { toApiTagSegment } from '@/domain/clan/clan-tag';
import { parseClanMembers } from '@/domain/clan/members';
import { buildClanWarHistory } from '@/domain/war/war-history';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ServerResourceResult } from '@/lib/server-clan-resource';
import {
  readStoredPurgeSettings,
  storePurgeSettings,
} from '@/lib/purge-settings-storage';
import { ClanStatusMessage } from '../components/clan/clan-status-message';
import { HrAssistantSection } from '../components/hr-assistant-section';
import { PurgeSection } from '../components/purge-section';
import { useTranslations } from '../components/i18n/locale-provider';

// Seuil par defaut de combats sur la semaine en cours (regle produit du
// 2026-08-02), partage entre "A expulser" et "Sur la sellette".
const DEFAULT_MIN_WEEKLY_BATTLES = 8;

interface RhViewProps {
  tag: string;
  clanSeed: ServerResourceResult<unknown>;
  warSeed?: ServerResourceResult<unknown>;
  logSeed?: ServerResourceResult<unknown>;
}

export function RhView({ tag, clanSeed, warSeed, logSeed }: RhViewProps) {
  const { t } = useTranslations();
  const clanPath = `/api/clans/${toApiTagSegment(tag)}`;
  const [minWeeklyBattles, setMinWeeklyBattles] = useState(
    () => readStoredPurgeSettings()?.minWeeklyBattles ?? DEFAULT_MIN_WEEKLY_BATTLES,
  );

  const clanState = useApiResource<unknown>(clanPath, clanSeed);
  const clanConfirmed = clanState.status === 'success';
  const warState = useApiResource<unknown>(
    clanConfirmed ? `${clanPath}/currentriverrace` : null,
    warSeed,
  );
  const logState = useApiResource<unknown>(
    clanConfirmed ? `${clanPath}/riverracelog` : null,
    logSeed,
  );

  useEffect(() => {
    storePurgeSettings({ minWeeklyBattles });
  }, [minWeeklyBattles]);

  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const attendance = useMemo(
    () =>
      logState.status === 'success'
        ? buildClanWarHistory(logState.data, tag).players
        : [],
    [logState, tag],
  );

  return (
    <div className="space-y-10">
      <ClanStatusMessage state={clanState} idleMessage={t('pages.rhIdle')} />

      {clanState.status === 'success' && (
        <>
          <HrAssistantSection
            members={members}
            attendance={attendance}
            logState={logState}
            warState={warState}
            minWeeklyBattles={minWeeklyBattles}
          />

          <PurgeSection
            members={members}
            warState={warState}
            minWeeklyBattles={minWeeklyBattles}
            onMinWeeklyBattlesChange={setMinWeeklyBattles}
            ready={clanState.status === 'success' && warState.status === 'success'}
          />
        </>
      )}
    </div>
  );
}
