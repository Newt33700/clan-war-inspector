/**
 * Bornage defensif des decomptes issus de l'API.
 * Partage par le moteur d'historique (0..16) et le suivi en direct (0..4).
 */

/**
 * Borne un decompte dans [0, max].
 * Valeur manquante ou non numerique -> 0 ; chaine numerique -> coercee
 * (audit UX du 2026-08-02, US-4) ; fractionnaire -> tronquee ; aberrante
 * (dont l'infini, contrairement a `toSafeCount` qui n'a pas de plafond
 * naturel) -> ecretee a max.
 */
export function clampCount(value: unknown, max: number): number {
  let numeric: number;
  if (typeof value === 'number') {
    numeric = value;
  } else if (typeof value === 'string' && value.trim().length > 0) {
    // Le garde `value.trim().length > 0` (et son operateur `>`) sont des
    // mutants Stryker equivalents pour toute chaine blanche : `Number('')`
    // et `Number('   ')` valent deja 0 en JS, donc le resultat final est
    // identique que ce garde laisse passer ou non une chaine blanche.
    numeric = Number(value);
  } else {
    return 0;
  }
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.min(max, Math.max(0, Math.trunc(numeric)));
}
