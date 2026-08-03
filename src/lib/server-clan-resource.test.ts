/**
 * Tests de fetchClanResource (US 13.2) : relaye proxyClanResource, sans
 * repasser par un Route Handler. Le reseau amont Supercell est mocke par
 * MSW, comme pour les tests des Route Handlers eux-memes.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import { mockServer } from '@/mocks/server';
import { fetchClanResource } from './server-clan-resource';

describe('fetchClanResource', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'server-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
});
