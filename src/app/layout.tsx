import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Lilita_One, Nunito } from 'next/font/google';

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
  title: 'Clan War Inspector',
  description:
    'Suivez l assiduite de votre clan Clash Royale en guerre : 16 combats par semaine, joueur par joueur.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="bg-royale-navy-950 text-royale-parchment min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
