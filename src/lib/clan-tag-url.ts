/**
 * Tag de clan reflete dans l'URL (US 6.2).
 *
 * Permet de partager un lien direct vers un clan et de reutiliser le
 * bouton retour du navigateur. Complementaire de clan-tag-storage.ts
 * (localStorage) : l'URL est prioritaire au chargement, `replaceState`
 * evite d'empiler une entree d'historique a chaque soumission.
 */

import { isValidClanTag, normalizeClanTag } from '@/domain/clan/clan-tag';

const URL_PARAM = 'clan';

/** Lit le tag de clan depuis une query string, `null` si absent ou invalide. */
export function readClanTagFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  const raw = params.get(URL_PARAM);
  if (raw === null || !isValidClanTag(raw)) {
    return null;
  }
  return normalizeClanTag(raw);
}

/**
 * Ecrit le tag (normalise) dans le parametre `clan` de l'URL courante, sans
 * recharger la page ni empiler d'entree d'historique. Silencieux si
 * l'API History est indisponible ou bloquee.
 */
export function writeClanTagToUrl(tag: string): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, normalizeClanTag(tag));
    window.history.replaceState(null, '', url);
  } catch {
    // Navigation privee ou URL non manipulable : le tag reste memorise via localStorage.
  }
}
