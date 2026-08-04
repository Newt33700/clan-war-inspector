import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { getServerTranslator } from '@/i18n/get-translator';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { SwordsIcon } from '../components/section-icons';
import { MeteoView } from './meteo-view';

interface MeteoPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** La Meteo du Clan (US 12, "Consistency Trend"). */
export default async function MeteoPage({ searchParams }: MeteoPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);
  const t = await getServerTranslator();

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
          <SwordsIcon className="text-royale-red-700 h-6 w-6" />
          {t('pages.meteoTitle')}
        </h1>
        <ClanSearchForm hasActiveClan={false} />
        <p className="text-royale-parchment-dim">{t('pages.meteoIdle')}</p>
      </div>
    );
  }

  const clanResult = await fetchClanResource<unknown>(tag, '');
  let logResult: ServerResourceResult<unknown> | undefined;
  if (clanResult.status === 'success') {
    logResult = await fetchClanResource<unknown>(tag, '/riverracelog');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        {t('pages.meteoTitle')}
      </h1>
      <ClanSearchForm hasActiveClan={true} />
      <MeteoView tag={tag} clanSeed={clanResult} logSeed={logResult} />
    </div>
  );
}
