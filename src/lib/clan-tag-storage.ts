/**
 * Persistance du dernier tag de clan inspecte.
 *
 * Un chef de clan revient toujours voir le meme clan : on memorise le
 * dernier tag valide dans localStorage et on le recharge au retour.
 * Toutes les operations sont tolerantes (SSR, navigation privee,
 * stockage plein) : en cas d'echec, on se comporte comme sans memoire.
 */

import { isValidClanTag, normalizeClanTag } from '@/domain/clan/clan-tag';

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

/** Memorise un tag (normalise) ; silencieux si le stockage est indisponible. */
export function storeClanTag(tag: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, normalizeClanTag(tag));
  } catch {
    // Navigation privee ou stockage plein : tant pis pour la memoire.
  }
}
