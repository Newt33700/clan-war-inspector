/**
 * Cookie de persistance du tag de clan (US 13.1, Épique 13).
 *
 * Complète `clan-tag-storage.ts` (localStorage) : un Server Component ne
 * peut pas lire le localStorage au premier rendu (pas de DOM côté
 * serveur). Le cookie permet à `app/dashboard`, `app/historique` et
 * `app/rh` de résoudre le clan actif dès la requête serveur, sans flash de
 * contenu vide le temps de l'hydratation client.
 *
 * Fonctions pures, sans dépendance à `document` ni à `next/headers`, pour
 * rester testables indépendamment de l'environnement (navigateur ou
 * Server Component).
 */

import { isValidClanTag, normalizeClanTag } from '@/domain/clan/clan-tag';

export const CLAN_TAG_COOKIE_NAME = 'cwi_clan_tag';

/** Duree de vie du cookie : 180 jours, alignee sur un usage recurrent. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/**
 * Extrait le tag de clan (normalise) d'une valeur brute de cookie,
 * `null` si absente ou invalide. `rawValue` est deja decode (ex. valeur
 * retournee par `cookies().get(...).value` ou `document.cookie` apres
 * decodeURIComponent).
 */
export function parseClanTagCookieValue(
  rawValue: string | null | undefined,
): string | null {
  if (rawValue === null || rawValue === undefined || !isValidClanTag(rawValue)) {
    return null;
  }
  return normalizeClanTag(rawValue);
}

/**
 * Construit la chaine `Set-Cookie`/`document.cookie` pour memoriser `tag`.
 * `Path=/` (valable sur toutes les routes), `SameSite=Lax` (navigation
 * normale, pas de partage cross-site), pas de `HttpOnly` : le client doit
 * pouvoir le relire (ex. pour l'ecrire de nouveau apres normalisation).
 */
export function buildClanTagCookieString(tag: string): string {
  const value = encodeURIComponent(normalizeClanTag(tag));
  return `${CLAN_TAG_COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
