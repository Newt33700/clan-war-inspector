'use client';

/**
 * La Meteo du Clan (US 12, "Consistency Trend") : a besoin du clan
 * (membres actuels) et de riverracelog (5 dernieres semaines), comme
 * l'historique (`historique-view.tsx`) -- pas de la guerre en cours, la
 * tendance ne regarde que l'historique.
 */

import { toApiTagSegment } from '@/domain/clan/clan-tag';
import { useApiResource } from '@/hooks/use-api-resource';
import type { ServerResourceResult } from '@/lib/server-clan-resource';
import { ClanStatusMessage } from '../components/clan/clan-status-message';
import { WeatherSection } from '../components/weather-section';
import { useTranslations } from '../components/i18n/locale-provider';

interface MeteoViewProps {
  tag: string;
  clanSeed: ServerResourceResult<unknown>;
  logSeed?: ServerResourceResult<unknown>;
}

export function MeteoView({ tag, clanSeed, logSeed }: MeteoViewProps) {
  const { t } = useTranslations();
  const clanPath = `/api/clans/${toApiTagSegment(tag)}`;
  const clanState = useApiResource<unknown>(clanPath, clanSeed);
  const clanConfirmed = clanState.status === 'success';
  const logState = useApiResource<unknown>(
    clanConfirmed ? `${clanPath}/riverracelog` : null,
    logSeed,
  );

  return (
    <div className="space-y-10">
      <ClanStatusMessage state={clanState} idleMessage={t('pages.meteoIdle')} />

      {clanState.status === 'success' && (
        <WeatherSection clanTag={tag} clanState={clanState} logState={logState} />
      )}
    </div>
  );
}
