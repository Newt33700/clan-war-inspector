import { fetchClanResource, type ServerResourceResult } from '@/lib/server-clan-resource';
import { resolveActiveClanTag } from '@/lib/resolve-clan-tag';
import { getServerTranslator } from '@/i18n/get-translator';
import { ClanSearchForm } from '../components/clan/clan-search-form';
import { SwordsIcon } from '../components/section-icons';
import { DashboardView } from './dashboard-view';

interface DashboardPageProps {
  searchParams: Promise<{ clan?: string | string[] }>;
}

/**
 * Vue d'ensemble du clan (US 13.2/13.6, Epique 13) : Server Component qui
 * resout le clan actif (URL > cookie) et fetch ses donnees avant tout
 * rendu -- aucun etat client ne gere le chargement initial (directive
 * de la spec Routing), l'interactivite (tri, recherche, panneau joueur)
 * reste dans `DashboardView`.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const tag = await resolveActiveClanTag(await searchParams);
  const t = await getServerTranslator();

  if (tag === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-royale-parchment font-display flex items-center gap-2 text-2xl tracking-wide">
          <SwordsIcon className="text-royale-red-700 h-6 w-6" />
          {t('pages.dashboardTitle')}
        </h1>
        <ClanSearchForm hasActiveClan={false} />
        <p className="text-royale-parchment-dim">{t('pages.dashboardIdle')}</p>
      </div>
    );
  }

  const clanResult = await fetchClanResource<unknown>(tag, '');
  let warResult: ServerResourceResult<unknown> | undefined;
  let logResult: ServerResourceResult<unknown> | undefined;
  // La guerre en cours et l'historique ne sont fetches qu'une fois le clan
  // confirme (US 6.3) : un tag valide mais inexistant ne declenche qu'une
  // seule alerte, pas trois requetes vouees au 404.
  if (clanResult.status === 'success') {
    [warResult, logResult] = await Promise.all([
      fetchClanResource<unknown>(tag, '/currentriverrace'),
      fetchClanResource<unknown>(tag, '/riverracelog'),
    ]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        {t('pages.dashboardTitle')}
      </h1>
      <ClanSearchForm hasActiveClan={true} />
      <DashboardView
        tag={tag}
        clanSeed={clanResult}
        warSeed={warResult}
        logSeed={logResult}
      />
    </div>
  );
}
