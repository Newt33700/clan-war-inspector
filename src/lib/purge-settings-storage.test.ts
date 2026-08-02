/**
 * Tests de la persistance du reglage "A expulser" (audit UX du 2026-08-02,
 * US-9).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readStoredPurgeSettings, storePurgeSettings } from './purge-settings-storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('storePurgeSettings / readStoredPurgeSettings', () => {
  it('relit un reglage memorise', () => {
    storePurgeSettings({ minWarBattles: 10, combinator: 'OR' });
    expect(readStoredPurgeSettings()).toEqual({ minWarBattles: 10, combinator: 'OR' });
  });

  it('retourne null si rien n est memorise', () => {
    expect(readStoredPurgeSettings()).toBeNull();
  });

  it.each([
    ['JSON invalide', 'not json'],
    ['tableau', '[]'],
    ['champ manquant', '{"minWarBattles": 8}'],
    ['minWarBattles non numerique', '{"minWarBattles": "8", "combinator": "AND"}'],
    ['minWarBattles negatif', '{"minWarBattles": -1, "combinator": "AND"}'],
    ['combinator invalide', '{"minWarBattles": 8, "combinator": "XOR"}'],
  ])('retourne null pour une valeur stockee inexploitable (%s)', (_label, raw) => {
    window.localStorage.setItem('clan-war-inspector:purge-settings', raw);
    expect(readStoredPurgeSettings()).toBeNull();
  });

  it('est tolerant si le stockage est indisponible', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(readStoredPurgeSettings()).toBeNull();
    getItem.mockRestore();

    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage full');
    });
    expect(() => storePurgeSettings({ minWarBattles: 5, combinator: 'AND' })).not.toThrow();
    setItem.mockRestore();
  });
});
