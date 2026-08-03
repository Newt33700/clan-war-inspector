import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { HistoriqueView } from './historique-view';

interface HistoriquePageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** Historique des guerres passees (US 13.2/13.6, Epique 13). */
export default async function HistoriquePage({ searchParams }: HistoriquePageProps) {
  const tag = await resolveActiveClanTag(await searchParams);

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
          Historique des guerres
        </h1>
        <ClanSearchForm />
        <p className="text-royale-parchment-dim">
          Saisissez le tag ou le nom de votre clan pour afficher son historique.
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
        Historique des guerres
      </h1>
      <ClanSearchForm />
      <HistoriqueView tag={tag} clanSeed={clanResult} logSeed={logResult} />
    </div>
  );
}
