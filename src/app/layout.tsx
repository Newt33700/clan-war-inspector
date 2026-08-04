import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Lilita_One, Nunito } from 'next/font/google';

import { DEFAULT_LOCALE } from '@/i18n/locale';
import { readLocaleFromCookies } from '@/lib/locale-server';
import { Footer } from './components/footer';
import { LocaleProvider } from './components/i18n/locale-provider';
import { BrandMark } from './components/navigation/brand-mark';
import { DesktopHeader } from './components/navigation/desktop-header';
import { MobileTabBar } from './components/navigation/mobile-tab-bar';
import { PageBackdrop } from './components/navigation/page-backdrop';
import './globals.css';

const displayFont = Lilita_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display-family',
  display: 'swap',
});

const bodyFont = Nunito({
  subsets: ['latin'],
  variable: '--font-body-family',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Clan War Inspector',
    template: '%s | Clan War Inspector',
  },
  description:
    'Suivez l assiduite de votre clan Clash Royale en guerre : 16 combats par semaine, joueur par joueur.',
  applicationName: 'Clan War Inspector',
  openGraph: {
    title: 'Clan War Inspector',
    description:
      'Qui a joue ses 16 combats de guerre cette semaine ? Le tableau de bord de votre clan Clash Royale.',
    type: 'website',
    locale: 'fr_FR',
  },
};

// Theme clair uniquement (pas de variante sombre codee) : evite que les
// navigateurs (Brave, Chrome Android...) repeignent la page via leur
// "dark mode force" faute de savoir qu'elle est deja pensee pour un fond
// clair.
export const viewport: Viewport = {
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Langue active resolue cote serveur (cookie, internationalisation
  // 2026-08-04) : premier rendu deja dans la bonne langue, sans flash --
  // meme principe que le tag de clan (US 13.1, `clan-tag-server.ts`).
  const locale = (await readLocaleFromCookies()) ?? DEFAULT_LOCALE;

  return (
    <html lang={locale} className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="text-royale-parchment flex min-h-screen flex-col font-sans antialiased">
        <LocaleProvider initialLocale={locale}>
          <PageBackdrop />
          <DesktopHeader />
          {/* Bandeau de marque mobile (pas un <h1> : chaque page porte le
              sien, propre a son contenu -- "Dashboard", "Historique des
              guerres", "Assistant RH" -- pour rester utile a la navigation
              au clavier/lecteur d'ecran plutot que de repeter le nom du
              produit sur toutes les pages). */}
          <p className="flex items-center gap-2 px-6 pt-8 pb-2 text-xs font-semibold tracking-[0.35em] text-amber-800 uppercase md:hidden">
            <BrandMark className="h-5 w-5" />
            Clan War Inspector
          </p>
          {/* flex-1 (2026-08-04) : pousse le footer en bas de l'ecran sur les
              pages courtes (etat idle "saisissez un clan") au lieu de le
              laisser flotter au milieu, entoure de damier vide. pb-tab-bar
              (US 14.7) : garde le contenu au-dessus de la MobileTabBar fixe,
              zone sure iOS comprise. */}
          <main className="mx-auto w-full max-w-4xl flex-1 px-6 md:pb-12">
            {children}
          </main>
          <Footer />
          <MobileTabBar />
        </LocaleProvider>
      </body>
    </html>
  );
}
