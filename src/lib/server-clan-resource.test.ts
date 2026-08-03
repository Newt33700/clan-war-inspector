/**
 * Tests de fetchClanResource (US 13.2, cache US 15.1) : relaye
 * proxyClanResource, sans repasser par un Route Handler. Le reseau amont
 * Supercell est mocke par MSW, comme pour les tests des Route Handlers
 * eux-memes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import { mockServer } from '@/mocks/server';
import { clearClanResourceCache, fetchClanResource } from './server-clan-resource';

describe('fetchClanResource', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'server-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearClanResourceCache();
    vi.useRealTimers();
  });

  it('retourne les donnees en cas de succes', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () =>
        HttpResponse.json({ tag: '#20PP', name: 'Test Clan' }),
      ),
    );

    const result = await fetchClanResource('#20PP', '');

    expect(result).toEqual({
      status: 'success',
      data: { tag: '#20PP', name: 'Test Clan' },
    });
  });

  it('retourne le message stable du proxy en cas d erreur', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () =>
        HttpResponse.json({ reason: 'notFound' }, { status: 404 }),
      ),
    );

    const result = await fetchClanResource('#20PP', '');

    expect(result).toEqual({
      status: 'error',
      message: 'Aucun clan ne correspond a ce tag.',
    });
  });

  it('rejette un tag invalide sans appel reseau', async () => {
    const result = await fetchClanResource('!!', '');

    expect(result.status).toBe('error');
  });

  describe('cache (US 15.1, 10 min par tag + sous-ressource)', () => {
    it('ne rappelle pas Supercell pour un meme tag+sous-ressource dans les 10 minutes', async () => {
      let calls = 0;
      mockServer.use(
        http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () => {
          calls += 1;
          return HttpResponse.json({ tag: '#20PP', name: 'Test Clan' });
        }),
      );

      const first = await fetchClanResource('#20PP', '');
      const second = await fetchClanResource('#20PP', '');

      expect(calls).toBe(1);
      expect(second).toEqual(first);
    });

    it('distingue le cache par sous-ressource pour un meme tag', async () => {
      let calls = 0;
      mockServer.use(
        http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
          calls += 1;
          return HttpResponse.json({
            tag: '#20PP',
            fromCurrentRiverRace: request.url.includes('currentriverrace'),
          });
        }),
      );

      await fetchClanResource('#20PP', '');
      await fetchClanResource('#20PP', '/currentriverrace');

      expect(calls).toBe(2);
    });

    it('distingue le cache par tag', async () => {
      let calls = 0;
      mockServer.use(
        http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () => {
          calls += 1;
          return HttpResponse.json({ tag: '#DIFFERENT' });
        }),
      );

      await fetchClanResource('#20PP', '');
      await fetchClanResource('#2PP', '');

      expect(calls).toBe(2);
    });

    it('ne met jamais en cache une erreur : un reessai relance un vrai appel', async () => {
      let calls = 0;
      mockServer.use(
        http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () => {
          calls += 1;
          return HttpResponse.json({ reason: 'notFound' }, { status: 404 });
        }),
      );

      await fetchClanResource('#20PP', '');
      await fetchClanResource('#20PP', '');

      expect(calls).toBe(2);
    });

    it('rappelle Supercell une fois les 10 minutes ecoulees', async () => {
      vi.useFakeTimers();
      let calls = 0;
      mockServer.use(
        http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () => {
          calls += 1;
          return HttpResponse.json({ tag: '#20PP' });
        }),
      );

      await fetchClanResource('#20PP', '');
      vi.advanceTimersByTime(10 * 60 * 1000 + 1);
      await fetchClanResource('#20PP', '');

      expect(calls).toBe(2);
    });

    it('reste dans le cache juste avant l expiration des 10 minutes', async () => {
      vi.useFakeTimers();
      let calls = 0;
      mockServer.use(
        http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () => {
          calls += 1;
          return HttpResponse.json({ tag: '#20PP' });
        }),
      );

      await fetchClanResource('#20PP', '');
      vi.advanceTimersByTime(10 * 60 * 1000 - 1);
      await fetchClanResource('#20PP', '');

      expect(calls).toBe(1);
    });
  });
});
