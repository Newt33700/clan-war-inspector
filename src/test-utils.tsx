/**
 * `render` de Testing Library enveloppe dans `<LocaleProvider>` (langue
 * francaise par defaut, comme l'app avant l'internationalisation du
 * 2026-08-04) et `<PlayerDrawerProvider>` (code joueur cliquable partout,
 * 2026-08-04) : tous les composants testes appellent desormais
 * `useTranslations` et certains `usePlayerDrawer` (directement ou via
 * `PlayerTagButton`), qui exigent ces contextes pour ne pas planter.
 *
 * `PlayerDrawerProvider` ne monte le panneau qu'apres une premiere
 * ouverture (voir son commentaire), donc l'ajouter ici ne pollue pas le DOM
 * des tests qui ne l'utilisent jamais.
 */

import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { LocaleProvider } from './app/components/i18n/locale-provider';
import { PlayerDrawerProvider } from './app/components/player-drawer-provider';

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <PlayerDrawerProvider>{children}</PlayerDrawerProvider>
    </LocaleProvider>
  );
}

export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
