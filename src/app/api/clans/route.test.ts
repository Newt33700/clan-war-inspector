/** Test du Route Handler GET /api/clans?name=... (US 10.1). */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mockServer } from '@/mocks/server';
import { SUPERCELL_API_BASE_URL } from '../_lib/supercell';
import { GET } from './route';

describe('GET /api/clans?name=...', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'route-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('relaye la recherche par nom depuis Supercell', async () => {
    const urls: string[] = [];
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({ items: [{ tag: '#2PP', name: 'Test Clan' }] });
      }),
    );

    const response = await GET(new Request('http://localhost/api/clans?name=Test'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [{ tag: '#2PP', name: 'Test Clan' }],
    });
    expect(urls[0]).toBe(`${SUPERCELL_API_BASE_URL}/clans?name=Test`);
  });

  it('rejette une requete trop courte sans appeler Supercell', async () => {
    const response = await GET(new Request('http://localhost/api/clans?name=ab'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_SEARCH_QUERY');
  });

  it('traite un parametre name absent comme une requete vide (rejetee)', async () => {
    const response = await GET(new Request('http://localhost/api/clans'));

    expect(response.status).toBe(400);
  });
});
