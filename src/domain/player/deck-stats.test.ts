import { describe, expect, it } from 'vitest';
import { averageElixirCost } from './deck-stats';

describe('averageElixirCost', () => {
  it('retourne 0 pour un deck vide', () => {
    expect(averageElixirCost([])).toBe(0);
  });

  it('calcule la moyenne arrondie a une decimale', () => {
    const deck = [
      { elixirCost: 3 },
      { elixirCost: 6 },
      { elixirCost: 5 },
      { elixirCost: 4 },
      { elixirCost: 3 },
      { elixirCost: 1 },
      { elixirCost: 4 },
      { elixirCost: 4 },
    ];
    expect(averageElixirCost(deck)).toBe(3.8);
  });

  it('gere une seule carte', () => {
    expect(averageElixirCost([{ elixirCost: 2 }])).toBe(2);
  });
});
