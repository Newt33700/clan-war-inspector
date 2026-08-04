'use client';

/**
 * Contexte de langue (internationalisation, 2026-08-04) : la langue
 * initiale est resolue cote serveur (cookie, `layout.tsx`) pour un premier
 * rendu deja dans la bonne langue, sans flash. Changer de langue est
 * instantane (tous les dictionnaires sont deja en memoire, pas de requete
 * reseau) et persiste en localStorage + cookie (`locale-storage.ts`) pour
 * les prochaines visites et les prochains Server Components.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locale';
import { translate, type TranslationVars } from '@/i18n/translate';
import { storeLocale } from '@/lib/locale-storage';

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, vars?: TranslationVars) => string;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  /** Langue resolue cote serveur (cookie), `DEFAULT_LOCALE` sinon. */
  initialLocale?: Locale;
  children: ReactNode;
}

export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: TranslationVars) => translate(dictionaries[locale], key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Acces a la langue active et a la fonction de traduction `t(cle, variables?)`. */
export function useTranslations(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context === null) {
    throw new Error('useTranslations doit etre utilise sous <LocaleProvider>.');
  }
  return context;
}
