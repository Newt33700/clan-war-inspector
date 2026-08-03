import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Lilita_One, Nunito } from 'next/font/google';

import { DesktopHeader } from './components/navigation/desktop-header';
import { MobileTabBar } from './components/navigation/mobile-tab-bar';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="bg-royale-navy-950 text-royale-parchment min-h-screen font-sans antialiased">
        <DesktopHeader />
        {/* Bandeau de marque mobile (pas un <h1> : chaque page porte le
            sien, propre a son contenu -- "Dashboard", "Historique des
            guerres", "Assistant RH" -- pour rester utile a la navigation
            au clavier/lecteur d'ecran plutot que de repeter le nom du
            produit sur toutes les pages). */}
        <p className="text-royale-gold-400 px-6 pt-8 pb-2 text-xs font-semibold tracking-[0.35em] uppercase md:hidden">
          Clan War Inspector
        </p>
        {/* pb-tab-bar (US 14.7) : garde le contenu au-dessus de la
            MobileTabBar fixe, zone sure iOS comprise. */}
        <main className="pb-tab-bar mx-auto max-w-4xl px-6 md:pb-12">{children}</main>
        <MobileTabBar />
      </body>
    </html>
  );
}
