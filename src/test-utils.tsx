/**
 * `render` de Testing Library enveloppe dans `<LocaleProvider>` (langue
 * francaise par defaut, comme l'app avant l'internationalisation du
 * 2026-08-04) : tous les composants testes appellent desormais
 * `useTranslations`, qui exige ce contexte pour ne pas planter.
 */

import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { LocaleProvider } from './app/components/i18n/locale-provider';

export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: LocaleProvider, ...options });
}

export * from '@testing-library/react';
