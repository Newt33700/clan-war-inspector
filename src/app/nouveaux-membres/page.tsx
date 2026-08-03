import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { NouveauxMembresView } from './nouveaux-membres-view';

interface NouveauxMembresPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** Sas de quarantaine des nouveaux membres (US 11, Epique 13). */
export default async function NouveauxMembresPage({
  searchParams,
}: NouveauxMembresPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
          Sas de quarantaine
        </h1>
        <ClanSearchForm />
        <p className="text-royale-parchment-dim">
          Saisissez le tag ou le nom de votre clan pour afficher le sas de quarantaine.
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
        Sas de quarantaine
      </h1>
      <ClanSearchForm />
      <NouveauxMembresView tag={tag} clanSeed={clanResult} logSeed={logResult} />
    </div>
  );
}
