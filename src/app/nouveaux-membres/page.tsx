import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { getServerTranslator } from '@/i18n/get-translator';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { PageHelpButton } from '../components/page-help-button';
import { NouveauxMembresView } from './nouveaux-membres-view';

interface NouveauxMembresPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** Sas de quarantaine des nouveaux membres (US 11, Epique 13). */
export default async function NouveauxMembresPage({
  searchParams,
}: NouveauxMembresPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);
  const t = await getServerTranslator();

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
          {t('pages.nouveauxMembresTitle')}
          <PageHelpButton page="nouveauxMembres" />
        </h1>
        <ClanSearchForm hasActiveClan={false} />
        <p className="text-royale-parchment-dim">{t('pages.nouveauxMembresIdle')}</p>
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
      <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
        {t('pages.nouveauxMembresTitle')}
        <PageHelpButton page="nouveauxMembres" />
      </h1>
      <ClanSearchForm hasActiveClan={true} />
      <NouveauxMembresView tag={tag} clanSeed={clanResult} logSeed={logResult} />
    </div>
  );
}
