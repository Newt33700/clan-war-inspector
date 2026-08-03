import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { RhView } from './rh-view';

interface RhPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** Assistant de moderation (US 13.2/13.6, Epique 13). */
export default async function RhPage({ searchParams }: RhPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
          Assistant RH
        </h1>
        <ClanSearchForm />
        <p className="text-royale-parchment-dim">
          Saisissez le tag ou le nom de votre clan pour afficher l assistant RH.
        </p>
      </div>
    );
  }

  const clanResult = await fetchClanResource<unknown>(tag, '');
  let warResult: ServerResourceResult<unknown> | undefined;
  let logResult: ServerResourceResult<unknown> | undefined;
  if (clanResult.status === 'success') {
    [warResult, logResult] = await Promise.all([
      fetchClanResource<unknown>(tag, '/currentriverrace'),
      fetchClanResource<unknown>(tag, '/riverracelog'),
    ]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        Assistant RH
      </h1>
      <ClanSearchForm />
      <RhView tag={tag} clanSeed={clanResult} warSeed={warResult} logSeed={logResult} />
    </div>
  );
}
