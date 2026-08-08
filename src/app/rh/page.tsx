import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { getServerTranslator } from '@/i18n/get-translator';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { PageHelpButton } from '../components/page-help-button';
import { RhView } from './rh-view';

interface RhPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/** Assistant de moderation (US 13.2/13.6, Epique 13). */
export default async function RhPage({ searchParams }: RhPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);
  const t = await getServerTranslator();

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
          {t('pages.rhTitle')}
          <PageHelpButton page="rh" />
        </h1>
        <ClanSearchForm hasActiveClan={false} />
        <p className="text-royale-parchment-dim">{t('pages.rhIdle')}</p>
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
      <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
        {t('pages.rhTitle')}
        <PageHelpButton page="rh" />
      </h1>
      <ClanSearchForm hasActiveClan={true} />
      <RhView tag={tag} clanSeed={clanResult} warSeed={warResult} logSeed={logResult} />
    </div>
  );
}
