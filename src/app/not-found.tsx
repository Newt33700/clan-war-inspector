'use client';

import Link from 'next/link';
import { useTranslations } from './components/i18n/locale-provider';

export default function NotFound() {
  const { t } = useTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-7xl text-amber-800">{t('notFoundPage.code')}</p>
      <h1 className="text-royale-parchment font-display text-2xl tracking-wide">
        {t('notFoundPage.heading')}
      </h1>
      <p className="text-royale-parchment-dim">{t('notFoundPage.description')}</p>
      <Link
        href="/"
        className="bg-royale-gold-400 text-royale-navy-950 rounded-md px-4 py-2 font-semibold"
      >
        {t('notFoundPage.backLink')}
      </Link>
    </main>
  );
}
