/**
 * Repartition de la collection de cartes d'un joueur par niveau (retour
 * utilisateur du 2026-08-04) : combien de cartes possede-t-il a chaque
 * niveau ? Fonction pure, sans dependance reseau ni framework.
 */

export interface OwnedCard {
  level: number;
}

export interface CardLevelCount {
  level: number;
  count: number;
}

/** Regroupe les cartes possedees par niveau, triees du plus haut au plus bas. */
export function summarizeCardsByLevel(cards: OwnedCard[]): CardLevelCount[] {
  const counts = new Map<number, number>();
  for (const card of cards) {
    counts.set(card.level, (counts.get(card.level) ?? 0) + 1);
  }
  return Array.from(counts, ([level, count]) => ({ level, count })).sort(
    (a, b) => b.level - a.level,
  );
}
