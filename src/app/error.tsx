'use client';

/**
 * Filet de securite global : une erreur de rendu inattendue affiche un
 * ecran thematise avec possibilite de reessayer, plutot qu'une page
 * blanche. Les erreurs metier (proxy, reseau) restent gerees localement
 * par les sections du dashboard.
 */

import { useTranslations } from './components/i18n/locale-provider';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-royale-red-700 text-5xl">{t('errorPage.title')}</p>
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        {t('errorPage.heading')}
      </h1>
      <p className="text-royale-parchment-dim">{t('errorPage.description')}</p>
      <button
        type="button"
        onClick={reset}
        className="bg-royale-gold-400 text-royale-navy-950 rounded-md px-4 py-2 font-semibold"
      >
        {t('common.retry')}
      </button>
    </main>
  );
}
