'use client';

/**
 * Selecteur de langue (internationalisation, 2026-08-04) : les noms de
 * langue affiches sont toujours dans leur propre langue (convention UX
 * standard, "Deutsch" reste "Deutsch" meme depuis un menu en anglais) --
 * ils ne font donc pas partie des dictionnaires traduits.
 */

import { SUPPORTED_LOCALES, type Locale } from '@/i18n/locale';
import { useTranslations } from './locale-provider';

const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  it: 'Italiano',
  es: 'Español',
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslations();

  return (
    <label className="flex items-center gap-1 text-xs text-slate-400">
      <span className="sr-only">{t('languageSwitcher.label')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t('languageSwitcher.label')}
        className="min-h-8 rounded border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-300"
      >
        {SUPPORTED_LOCALES.map((candidate) => (
          <option key={candidate} value={candidate}>
            {LOCALE_NATIVE_NAMES[candidate]}
          </option>
        ))}
      </select>
    </label>
  );
}
