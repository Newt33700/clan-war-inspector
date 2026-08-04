/**
 * Cookie de persistance de la langue choisie (internationalisation,
 * 2026-08-04), sur le meme modele que `clan-tag-cookie.ts` : un
 * Server Component (layout racine) doit pouvoir la resoudre des la
 * premiere requete, sans attendre l'hydratation client.
 */

import { isLocale, type Locale } from '@/i18n/locale';

export const LOCALE_COOKIE_NAME = 'cwi_locale';

/** Duree de vie du cookie : 1 an, un choix de langue change rarement. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Extrait la langue d'une valeur brute de cookie, `null` si absente/invalide. */
export function parseLocaleCookieValue(
  rawValue: string | null | undefined,
): Locale | null {
  if (rawValue === null || rawValue === undefined || !isLocale(rawValue)) {
    return null;
  }
  return rawValue;
}

/** Construit la chaine `Set-Cookie`/`document.cookie` pour memoriser `locale`. */
export function buildLocaleCookieString(locale: Locale): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
