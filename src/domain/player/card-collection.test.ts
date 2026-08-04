import { describe, expect, it } from 'vitest';
import { summarizeCardsByLevel } from './card-collection';

describe('summarizeCardsByLevel', () => {
  it('retourne un tableau vide pour une collection vide', () => {
    expect(summarizeCardsByLevel([])).toEqual([]);
  });

  it('compte les cartes par niveau, triees du plus haut au plus bas', () => {
    const cards = [
      { level: 11 },
      { level: 9 },
      { level: 11 },
      { level: 14 },
      { level: 9 },
      { level: 9 },
    ];
    expect(summarizeCardsByLevel(cards)).toEqual([
      { level: 14, count: 1 },
      { level: 11, count: 2 },
      { level: 9, count: 3 },
    ]);
  });

  it('gere un unique niveau', () => {
    expect(summarizeCardsByLevel([{ level: 5 }, { level: 5 }])).toEqual([
      { level: 5, count: 2 },
    ]);
  });
});
