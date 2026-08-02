/**
 * Coercion numerique partagee entre les parsers du domaine : accepte un
 * compteur serialise en chaine (`"62"` au lieu de `62`) sans le rejeter,
 * pour tolerer les hebergements passant par un proxy tiers
 * (proxy.royaleapi.dev, cf. `_lib/supercell.ts`) qui peuvent produire ce
 * genre d'incoherence entre deux endpoints.
 *
 * Verifie contre le clan reel #20J20QG (validation du 2026-08-02) : ce
 * n'est PAS la cause du bug "Niveau a 0" observe en production sur la
 * colonne "Niveau" du tableau des membres — `expLevel` y arrive comme un
 * `number` valant deja `0` pour tous les membres, pas comme une chaine.
 * La vraie cause et le vrai correctif sont documentes dans
 * `domain/clan/members.ts` (`isExpLevelAvailable`).
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
