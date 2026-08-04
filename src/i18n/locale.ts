/**
 * Langues supportees par l'app (demande produit du 2026-08-04) : francais
 * (langue d'origine), anglais, italien, espagnol. `fr` reste la langue par
 * defaut (site initialement concu pour un public francophone).
 */

export const SUPPORTED_LOCALES = ['fr', 'en', 'it', 'es'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
