/**
 * Tests du "Hall of Fame" (US 8, revise le 2026-08-05) : top N par fame
 * de la semaine de guerre en cours. Logique pure, perimetre Stryker.
 */

import { describe, expect, it } from 'vitest';
import { topByFame } from './hall-of-fame';

describe('topByFame', () => {
  it('retourne [] pour une liste vide', () => {
    expect(topByFame([])).toEqual([]);
  });

  it('trie par fame decroissante', () => {
    const top = topByFame([
      { tag: '#P1', name: 'Joueur 1', fame: 800 },
      { tag: '#P2', name: 'Joueur 2', fame: 3200 },
      { tag: '#P3', name: 'Joueur 3', fame: 2100 },
    ]);
    expect(top.map((entry) => entry.tag)).toEqual(['#P2', '#P3', '#P1']);
  });

  it('se limite au top 3 par defaut', () => {
    const top = topByFame([
      { tag: '#P1', name: 'A', fame: 100 },
      { tag: '#P2', name: 'B', fame: 90 },
      { tag: '#P3', name: 'C', fame: 80 },
      { tag: '#P4', name: 'D', fame: 70 },
    ]);
    expect(top).toHaveLength(3);
    expect(top.map((entry) => entry.tag)).toEqual(['#P1', '#P2', '#P3']);
  });

  it('accepte un topN personnalise', () => {
    const top = topByFame(
      [
        { tag: '#P1', name: 'A', fame: 100 },
        { tag: '#P2', name: 'B', fame: 90 },
      ],
      1,
    );
    expect(top).toEqual([{ tag: '#P1', name: 'A', fame: 100 }]);
  });

  it('retourne tous les participants si moins nombreux que topN', () => {
    const top = topByFame([{ tag: '#P1', name: 'A', fame: 10 }]);
    expect(top).toEqual([{ tag: '#P1', name: 'A', fame: 10 }]);
  });

  it('conserve une fame nulle (semaine tout juste demarree)', () => {
    const top = topByFame([{ tag: '#P1', name: 'A', fame: 0 }]);
    expect(top).toEqual([{ tag: '#P1', name: 'A', fame: 0 }]);
  });

  it('departage une fame egale par nom puis tag', () => {
    const top = topByFame([
      { tag: '#Z', name: 'Zoe', fame: 100 },
      { tag: '#Y', name: 'Anna', fame: 100 },
    ]);
    expect(top.map((entry) => entry.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage une fame et un nom egaux par le tag', () => {
    const top = topByFame([
      { tag: '#ZZ', name: 'Jumeau', fame: 100 },
      { tag: '#AA', name: 'Jumeau', fame: 100 },
    ]);
    expect(top.map((entry) => entry.tag)).toEqual(['#AA', '#ZZ']);
  });

  it('priorise toujours la fame sur le nom, meme quand leurs ordres s opposent', () => {
    const top = topByFame([
      { tag: '#LOW', name: 'Anna', fame: 50 },
      { tag: '#HIGH', name: 'Zed', fame: 200 },
    ]);
    expect(top.map((entry) => entry.tag)).toEqual(['#HIGH', '#LOW']);
  });

  it('ne mute pas le tableau d entree', () => {
    const input = [
      { tag: '#B', name: 'Bob', fame: 10 },
      { tag: '#A', name: 'Alice', fame: 90 },
    ];
    const copy = [...input];
    topByFame(input);
    expect(input).toEqual(copy);
  });

  it('n expose que tag/name/fame, meme si la source porte des champs supplementaires', () => {
    const entries = [
      { tag: '#P1', name: 'A', fame: 10, decksUsedToday: 4, decksUsed: 16 },
    ];
    expect(topByFame(entries)).toEqual([{ tag: '#P1', name: 'A', fame: 10 }]);
  });
});
