/** Test du Route Handler GET /api/players/{playerTag}/battlelog (retour utilisateur 2026-08-04). */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mockServer } from '@/mocks/server';
import { SUPERCELL_API_BASE_URL } from '../../../_lib/supercell';
import { GET } from './route';

describe('GET /api/players/[playerTag]/battlelog', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'route-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('relaye les combats recents du joueur depuis Supercell', async () => {
    const urls: string[] = [];
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/players/*`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json([{ type: 'PvP' }]);
      }),
    );

    const response = await GET(new Request('http://localhost/api/players/P1/battlelog'), {
      params: Promise.resolve({ playerTag: 'P1' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ type: 'PvP' }]);
    expect(urls[0]).toBe(`${SUPERCELL_API_BASE_URL}/players/%23P1/battlelog`);
  });

  it('propage le mapping d erreur du proxy (404)', async () => {
    mockServer.use(
      http.get(
        `${SUPERCELL_API_BASE_URL}/players/*`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    const response = await GET(new Request('http://localhost/api/players/P1/battlelog'), {
      params: Promise.resolve({ playerTag: 'P1' }),
    });

    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error.code).toBe('PLAYER_NOT_FOUND');
  });
});
