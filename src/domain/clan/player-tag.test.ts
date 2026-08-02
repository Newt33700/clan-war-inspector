import { describe, expect, it } from 'vitest';
import { canonicalizePlayerTag, toApiPlayerTagSegment } from './player-tag';

describe('canonicalizePlayerTag', () => {
  it('prefixe un tag nu d un diese', () => {
    expect(canonicalizePlayerTag('P1UU')).toBe('#P1UU');
  });

  it('met en majuscules', () => {
    expect(canonicalizePlayerTag('p1uu')).toBe('#P1UU');
  });

  it('supprime espaces et dieses multiples de tete', () => {
    expect(canonicalizePlayerTag('  ##P1  ')).toBe('#P1');
  });

  it('ne supprime que les dieses de tete, pas ceux du milieu', () => {
    expect(canonicalizePlayerTag('P#1')).toBe('#P#1');
  });

  it('accepte un tag hors alphabet clan (donnee machine)', () => {
    expect(canonicalizePlayerTag('#PLAYER1')).toBe('#PLAYER1');
  });

  it.each([
    ['non string', 42],
    ['undefined', undefined],
    ['vide', ''],
    ['espaces seuls', '   '],
    ['diese seul', '#'],
  ])('retourne null pour un tag inutilisable (%s)', (_label, value) => {
    expect(canonicalizePlayerTag(value)).toBeNull();
  });
});

describe('toApiPlayerTagSegment', () => {
  it('encode le tag canonicalise pour un usage dans une URL', () => {
    expect(toApiPlayerTagSegment(' p1uu ')).toBe('%23P1UU');
  });

  it.each([
    ['vide', ''],
    ['espaces seuls', '   '],
    ['diese seul', '#'],
    ['non string', 42],
  ])('retourne null pour un tag inutilisable (%s)', (_label, value) => {
    expect(toApiPlayerTagSegment(value)).toBeNull();
  });
});
