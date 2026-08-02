/**
 * Coercion numerique partagee entre les parsers du domaine (audit UX du
 * 2026-08-02, US-4) : la colonne "Niveau" du tableau des membres affichait
 * 0 pour tous les joueurs en production, alors que la fiche joueur
 * (/players/{tag}) affiche la bonne valeur pour le meme champ `expLevel`.
 *
 * Cause : `typeof value !== 'number'` rejetait tout compteur serialise en
 * chaine (`"62"` au lieu de `62`), ce qu'un hebergement passant par un
 * proxy tiers (proxy.royaleapi.dev, cf. `_lib/supercell.ts`) peut produire
 * de facon inconsistante entre deux endpoints. Un entier legitime ne doit
 * pas retomber a 0 pour cette seule raison.
 */

/** Coerce une valeur en nombre fini, `null` si impossible. */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Entier positif : 0 pour toute valeur manquante, non numerique ou
 * aberrante.
 *
 * Le test `parsed === null` est un mutant Stryker equivalent : en JS,
 * `Math.trunc(null)` vaut deja 0, donc `Math.max(0, Math.trunc(parsed))`
 * retombe sur 0 meme sans ce garde. Conserve pour la clarte et le typage
 * TS (`Math.trunc` n'accepte pas `null` en strict mode).
 */
export function toSafeCount(value: unknown): number {
  const parsed = toFiniteNumber(value);
  return parsed === null ? 0 : Math.max(0, Math.trunc(parsed));
}
