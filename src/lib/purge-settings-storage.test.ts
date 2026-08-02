/**
 * Tests de la persistance du seuil d'activite hebdomadaire (regle produit
 * du 2026-08-02, partagee entre "A expulser" et "Sur la sellette").
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readStoredPurgeSettings, storePurgeSettings } from './purge-settings-storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('storePurgeSettings / readStoredPurgeSettings', () => {
  it('relit un reglage memorise', () => {
    storePurgeSettings({ minWeeklyBattles: 10 });
    expect(readStoredPurgeSettings()).toEqual({ minWeeklyBattles: 10 });
  });

  it('retourne null si rien n est memorise', () => {
    expect(readStoredPurgeSettings()).toBeNull();
  });

  it.each([
    ['JSON invalide', 'not json'],
    ['tableau', '[]'],
    ['champ manquant', '{}'],
    ['minWeeklyBattles non numerique', '{"minWeeklyBattles": "8"}'],
    ['minWeeklyBattles negatif', '{"minWeeklyBattles": -1}'],
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
    expect(() => storePurgeSettings({ minWeeklyBattles: 5 })).not.toThrow();
    setItem.mockRestore();
  });
});
