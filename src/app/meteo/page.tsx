import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { SwordsIcon } from '../components/section-icons';
import { MeteoView } from './meteo-view';

interface MeteoPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** La Meteo du Clan (US 12, "Consistency Trend"). */
export default async function MeteoPage({ searchParams }: MeteoPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
          <SwordsIcon className="text-royale-red-700 h-6 w-6" />
          La Meteo du Clan
        </h1>
        <ClanSearchForm />
        <p className="text-royale-parchment-dim">
          Saisissez le tag ou le nom de votre clan pour afficher la meteo du clan.
        </p>
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
        La Meteo du Clan
      </h1>
      <ClanSearchForm />
      <MeteoView tag={tag} clanSeed={clanResult} logSeed={logResult} />
    </div>
  );
}
