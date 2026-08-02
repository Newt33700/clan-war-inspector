/**
 * Tests de la coercion numerique partagee (audit UX du 2026-08-02, US-4).
 * Verrouille en particulier la coercion des compteurs serialises en
 * chaine, cause identifiee du bug "Niveau toujours a 0" observe en
 * production.
 */

import { describe, expect, it } from 'vitest';
import { toFiniteNumber, toSafeCount } from './numeric';

describe('toFiniteNumber', () => {
  it('conserve un nombre fini', () => {
    expect(toFiniteNumber(62)).toBe(62);
    expect(toFiniteNumber(0)).toBe(0);
    expect(toFiniteNumber(-5)).toBe(-5);
  });

  it('rejette un nombre non fini', () => {
    expect(toFiniteNumber(Number.NaN)).toBeNull();
    expect(toFiniteNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toFiniteNumber(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  it('coerce une chaine numerique en nombre', () => {
    expect(toFiniteNumber('62')).toBe(62);
    expect(toFiniteNumber('0')).toBe(0);
    expect(toFiniteNumber(' 13 ')).toBe(13);
    expect(toFiniteNumber('15.9')).toBe(15.9);
  });

  it('rejette une chaine vide, blanche ou non numerique', () => {
    expect(toFiniteNumber('')).toBeNull();
    expect(toFiniteNumber('   ')).toBeNull();
    expect(toFiniteNumber('oops')).toBeNull();
  });

  it.each([[null], [undefined], [{}], [[]], [true], [Symbol('x')]])(
    'rejette un type non exploitable (%s)',
    (value) => {
      expect(toFiniteNumber(value)).toBeNull();
    },
  );
});

describe('toSafeCount', () => {
  it('coerce une chaine numerique comme un niveau de joueur reel', () => {
    // Reproduit exactement le cas de l'audit : Julix, Niveau 0 en tableau
    // vs Niveau 62 en fiche joueur, pour la meme donnee source.
    expect(toSafeCount('62')).toBe(62);
  });

  it('borne a 0 une valeur manquante, non numerique ou negative', () => {
    expect(toSafeCount(undefined)).toBe(0);
    expect(toSafeCount('oops')).toBe(0);
    expect(toSafeCount(-5)).toBe(0);
    expect(toSafeCount(Number.NaN)).toBe(0);
  });

  it('tronque une valeur fractionnaire, y compris en chaine', () => {
    expect(toSafeCount(5000.9)).toBe(5000);
    expect(toSafeCount('5000.9')).toBe(5000);
  });
});
