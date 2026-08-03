/**
 * Lecture du tag de clan cote serveur (US 13.1, Epique 13).
 *
 * Seul point de contact avec `next/headers` pour la resolution du clan
 * actif : garde le reste de la logique (validation, normalisation) dans
 * `clan-tag-cookie.ts`, pur et teste independamment.
 */

import { cookies } from 'next/headers';
import { CLAN_TAG_COOKIE_NAME, parseClanTagCookieValue } from './clan-tag-cookie';

/** Lit le tag de clan depuis le cookie de la requete en cours, `null` si absent/invalide. */
export async function readClanTagFromCookies(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(CLAN_TAG_COOKIE_NAME)?.value;
  if (raw === undefined) {
    return null;
  }
  return parseClanTagCookieValue(decodeURIComponent(raw));
}
