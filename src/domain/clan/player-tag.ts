/**
 * Canonicalisation des tags joueurs.
 *
 * Contrairement au tag de clan (saisie humaine, validation stricte via
 * `normalizeClanTag`), les tags joueurs proviennent de la machine
 * Supercell : on les canonicalise (casse, dieses, espaces) sans les
 * valider, pour ne jamais perdre un joueur a cause d'un tag exotique.
 */

/** Canonicalise un tag joueur, `null` si vide ou non textuel. */
export function canonicalizePlayerTag(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const candidate = value.trim().toUpperCase().replace(/^#+/, '');
  if (candidate.length === 0) {
    return null;
  }
  return `#${candidate}`;
}
