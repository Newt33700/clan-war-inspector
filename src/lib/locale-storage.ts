/**
 * Persistance cote client de la langue choisie : localStorage (lecture
 * rapide au montage) + cookie (US-like pattern de `clan-tag-storage.ts`,
 * pour que le Server Component racine la resolve des la requete
 * suivante). Toutes les operations sont tolerantes (navigation privee,
 * stockage plein) : en cas d'echec, on retombe sur la langue par defaut.
 */

import { isLocale, type Locale } from '@/i18n/locale';
import { buildLocaleCookieString } from './locale-cookie';

const STORAGE_KEY = 'clan-war-inspector:locale';

/** Lit la langue memorisee, `null` si absente ou invalide. */
export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored !== null && isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Memorise `locale` en localStorage et en cookie. */
export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Navigation privee ou stockage plein : tant pis pour la memoire.
  }
  try {
    document.cookie = buildLocaleCookieString(locale);
  } catch {
    // Cookies desactives : le Server Component retombera sur le francais.
  }
}
