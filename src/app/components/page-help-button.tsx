'use client';

/**
 * Bouton d'aide contextuelle (retour utilisateur clan French 4, #QC29VC08,
 * 2026-08-08 : "MÉTÉO n'est pas à jour... comment doit-il fonctionner ?") :
 * chaque page expose desormais un "?" qui ouvre une pop-up expliquant, en
 * francais courant sans jargon, ce que la page affiche et d'ou viennent les
 * donnees -- pour un utilisateur non informaticien, pas seulement le chef
 * de clan technophile.
 *
 * Boite de dialogue modale accessible, meme mecanique que `PlayerDrawer`
 * (US 14.3) : focus initial dedans, Tab/Shift+Tab cantonnes, Echap ferme,
 * focus restaure sur le bouton a la fermeture.
 */

import { useId, useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useTranslations } from './i18n/locale-provider';

interface PageHelpButtonProps {
  /** Prefixe i18n : lit `pageHelp.<page>Title` et `pageHelp.<page>Body`. */
  page: string;
}

export function PageHelpButton({ page }: PageHelpButtonProps) {
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, () => setIsOpen(false));

  // Nom du bouton distinct par page (ex. "Dashboard", "La Météo du Clan"),
  // deja traduit pour le H1 de la page (`pages.<page>Title`) : le titre
  // affiche DANS la pop-up reste volontairement generique ("A quoi sert
  // cette page ?"), les deux cles jouent des roles differents.
  const pageName = t(`pages.${page}Title`);
  const helpTitle = t(`pageHelp.${page}Title`);
  // Paragraphes separes par une ligne vide dans le dictionnaire (US
  // accessibilite generale) : une pop-up d'explication, pas un roman, donc
  // pas besoin d'un format plus riche qu'un decoupage en <p>.
  const paragraphs = t(`pageHelp.${page}Body`)
    .split('\n\n')
    .filter((paragraph) => paragraph.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('pageHelp.openLabel', { title: pageName })}
        className="border-royale-parchment-dim text-royale-parchment-dim hover:border-royale-parchment hover:text-royale-parchment flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
      >
        <span aria-hidden="true">?</span>
      </button>

      {isOpen && (
        <>
          <div
            data-testid="page-help-overlay"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="bg-cr-panel-light fixed inset-x-4 top-1/2 z-50 max-h-[80vh] max-w-md -translate-y-1/2 overflow-y-auto rounded-lg border-2 border-black p-6 shadow-xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={titleId}
                className="font-display text-lg tracking-wide text-slate-900"
              >
                {helpTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t('pageHelp.close')}
                className="text-xl leading-none text-slate-500 hover:text-slate-900"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
