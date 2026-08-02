/**
 * Bornage defensif des decomptes issus de l'API.
 * Partage par le moteur d'historique (0..16) et le suivi en direct (0..4).
 */

/**
 * Borne un decompte dans [0, max].
 * Valeur manquante ou non numerique -> 0 ; fractionnaire -> tronquee ;
 * aberrante (dont l'infini) -> ecretee a max.
 */
export function clampCount(value: unknown, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(max, Math.max(0, Math.trunc(value)));
}
