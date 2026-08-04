/**
 * Statistiques derivees du deck d'un joueur (retour utilisateur 2026-08-04,
 * inspiration StatsRoyale) : cout moyen en elixir. Fonction pure.
 */

export interface ElixirCard {
  elixirCost: number;
}

/** Cout moyen en elixir du deck, arrondi a une decimale. `0` pour un deck vide. */
export function averageElixirCost(cards: ElixirCard[]): number {
  if (cards.length === 0) {
    return 0;
  }
  const total = cards.reduce((sum, card) => sum + card.elixirCost, 0);
  return Math.round((total / cards.length) * 10) / 10;
}
