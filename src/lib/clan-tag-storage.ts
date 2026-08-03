/**
 * Persistance du dernier tag de clan inspecte.
 *
 * Un chef de clan revient toujours voir le meme clan : on memorise le
 * dernier tag valide en localStorage (lecture cote client, ex. pre-remplir
 * un champ) et dans un cookie (US 13.1, Epique 13) afin que les Server
 * Components de `/dashboard`, `/historique` et `/rh` puissent le resoudre
 * des la premiere requete, sans attendre l'hydratation. Toutes les
 * operations sont tolerantes (SSR, navigation privee, stockage plein) :
 * en cas d'echec, on se comporte comme sans memoire.
 */

import { isValidClanTag, normalizeClanTag } from '@/domain/clan/clan-tag';
import {
  buildClanTagCookieString,
  CLAN_TAG_COOKIE_NAME,
  parseClanTagCookieValue,
} from './clan-tag-cookie';

const STORAGE_KEY = 'clan-war-inspector:last-clan-tag';

/** Lit le dernier tag memorise, `null` si absent ou invalide. */
export function readStoredClanTag(): string | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null || !isValidClanTag(stored)) {
      return null;
    }
    return normalizeClanTag(stored);
  } catch {
    return null;
  }
}

/** Memorise un tag (normalise) en localStorage et en cookie (US 13.1). */
export function storeClanTag(tag: string): void {
  const normalized = normalizeClanTag(tag);
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Navigation privee ou stockage plein : tant pis pour la memoire.
  }
  try {
    document.cookie = buildClanTagCookieString(normalized);
  } catch {
    // Cookies desactives : le Server Component retombera sur l'URL/idle.
  }
}

/**
 * Lit le tag depuis `document.cookie`, `null` si absent ou invalide.
 * Utile cote client pour detecter un cookie deja pose par une visite
 * precedente (ex. migration depuis un tag connu uniquement en
 * localStorage, avant l'introduction du cookie).
 */
export function readClanTagCookie(): string | null {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${CLAN_TAG_COOKIE_NAME}=([^;]*)`),
    );
    if (match === null) {
      return null;
    }
    return parseClanTagCookieValue(decodeURIComponent(match[1] ?? ''));
  } catch {
    return null;
  }
}
