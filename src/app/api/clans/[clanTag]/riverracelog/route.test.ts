/** Test du Route Handler GET /api/clans/{clanTag}/riverracelog. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mockServer } from '@/mocks/server';
import { SUPERCELL_API_BASE_URL } from '../../../_lib/supercell';
import { GET } from './route';

describe('GET /api/clans/[clanTag]/riverracelog', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'route-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('relaye l historique des guerres depuis Supercell', async () => {
    const urls: string[] = [];
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({ items: [] });
      }),
    );

    const response = await GET(
      new Request('http://localhost/api/clans/2PP/riverracelog'),
      { params: Promise.resolve({ clanTag: '2PP' }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
    expect(urls[0]).toBe(`${SUPERCELL_API_BASE_URL}/clans/%232PP/riverracelog`);
  });
});
