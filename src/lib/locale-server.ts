/**
 * Lecture de la langue active cote serveur, seul point de contact avec
 * `next/headers` pour la resolution de la langue (meme decoupage que
 * `clan-tag-server.ts`).
 */

import { cookies } from 'next/headers';
import type { Locale } from '@/i18n/locale';
import { LOCALE_COOKIE_NAME, parseLocaleCookieValue } from './locale-cookie';

/** Lit la langue depuis le cookie de la requete en cours, `null` si absente/invalide. */
export async function readLocaleFromCookies(): Promise<Locale | null> {
  const store = await cookies();
  return parseLocaleCookieValue(store.get(LOCALE_COOKIE_NAME)?.value);
}
