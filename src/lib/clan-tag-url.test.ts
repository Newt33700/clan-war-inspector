/**
 * Tests de la lecture/ecriture du tag de clan dans l'URL (US 6.2).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readClanTagFromUrl, writeClanTagToUrl } from './clan-tag-url';

describe('readClanTagFromUrl', () => {
  it('lit un tag valide encode dans le parametre clan', () => {
    expect(readClanTagFromUrl('?clan=%2320PP')).toBe('#20PP');
  });

  it('tolere un tag sans diese ou en minuscule', () => {
    expect(readClanTagFromUrl('?clan=20pp')).toBe('#20PP');
  });

  it.each([
    ['parametre absent', ''],
    ['tag invalide', '?clan=***'],
    ['tag trop court', '?clan=%23A'],
    ['autre parametre', '?tag=%2320PP'],
  ])('retourne null si non exploitable (%s)', (_label, search) => {
    expect(readClanTagFromUrl(search)).toBeNull();
  });
});

describe('writeClanTagToUrl', () => {
  const originalLocation = window.location.href;

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', originalLocation);
  });

  it('ecrit le tag normalise dans le parametre clan sans recharger la page', () => {
    writeClanTagToUrl('20pp');
    expect(window.location.search).toBe('?clan=%2320PP');
  });

  it('remplace un parametre clan existant plutot que de le dupliquer', () => {
    writeClanTagToUrl('#PPPP');
    writeClanTagToUrl('#QQQQ');
    const params = new URLSearchParams(window.location.search);
    expect(params.getAll('clan')).toEqual(['#QQQQ']);
  });

  it('ne leve pas si history.replaceState echoue (navigation privee, etc.)', () => {
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeClanTagToUrl('#PPPP')).not.toThrow();
  });
});
