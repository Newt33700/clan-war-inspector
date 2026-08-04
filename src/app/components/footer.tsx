'use client';

/**
 * Pied de page legal (US 13.3) : mention obligatoire de non-affiliation a
 * Supercell, affichee sur toutes les pages. Replie par defaut derriere un
 * simple lien "Licence" (retour utilisateur du 2026-08-04 : le bandeau
 * legal deplie en permanence prenait un quart de l'ecran mobile) -- le
 * texte integral, inchange, reste disponible en un clic, ce qui suffit a
 * rester dans les clous cote conformite. `pb-tab-bar` (comme `main` dans
 * `layout.tsx`) evite que le pied de page ne soit masque par la
 * MobileTabBar fixe.
 */

import { useState } from 'react';
import { LanguageSwitcher } from './i18n/language-switcher';
import { useTranslations } from './i18n/locale-provider';

export function Footer() {
  const { t } = useTranslations();
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  return (
    <footer className="pb-tab-bar bg-slate-900 px-6 py-4 text-xs text-slate-400 md:pb-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsLegalOpen((open) => !open)}
          aria-expanded={isLegalOpen}
          className="min-h-8 underline hover:text-slate-300"
        >
          {t('footer.licenseLabel')}
        </button>
        <LanguageSwitcher />
      </div>
      {isLegalOpen && (
        <p className="mx-auto mt-2 max-w-4xl">
          {t('footer.legalText')}{' '}
          <a
            href="https://www.supercell.com/fan-content-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-300"
          >
            {t('footer.linkLabel')}
          </a>
          .
        </p>
      )}
    </footer>
  );
}
