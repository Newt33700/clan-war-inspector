/**
 * Tests du proxy Supercell (US 1.5).
 *
 * Les appels sortants vers api.clashroyale.com sont interceptes par MSW :
 * aucun appel reel ne part pendant les tests. Chaque cas d'erreur amont
 * (404, 429, 500, 503, timeout, panne reseau) est simule ici.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { mockServer } from '@/mocks/server';
import {
  proxyClanResource,
  SUPERCELL_API_BASE_URL,
  type ProxyErrorBody,
} from './supercell';

/** Enregistre un handler amont et capture chaque requete recue. */
function stubUpstream(respond: (request: Request) => Response | Promise<Response>): {
  requests: Request[];
} {
  const captured: { requests: Request[] } = { requests: [] };
  mockServer.use(
    http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, async ({ request }) => {
      captured.requests.push(request.clone());
      return respond(request);
    }),
  );
  return captured;
}

async function readError(response: Response): Promise<ProxyErrorBody> {
  return (await response.json()) as ProxyErrorBody;
}

const TOKEN_OPTIONS = { apiToken: 'test-token' };

describe('proxyClanResource', () => {
  beforeEach(() => {
    // Par defaut, aucun token dans l'environnement de test.
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('validation du tag', () => {
    it('rejette un tag invalide en 400 sans appeler Supercell', async () => {
      const upstream = stubUpstream(() => HttpResponse.json({}));

      const response = await proxyClanResource('#2PZ', '', TOKEN_OPTIONS);
      const body = await readError(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('INVALID_TAG');
      expect(body.error.message.length).toBeGreaterThan(0);
      expect(upstream.requests).toHaveLength(0);
    });

    it('reutilise le message precis de la validation de tag', async () => {
      const response = await proxyClanResource('PY', '', TOKEN_OPTIONS);
      const body = await readError(response);

      expect(body.error.message).toContain('3');
    });

    it('propage une erreur inattendue au lieu de la deguiser en 400', async () => {
      // Une entree non-string fait planter la normalisation avec une
      // TypeError : elle ne doit PAS etre absorbee comme un tag invalide.
      await expect(proxyClanResource(null as never, '', TOKEN_OPTIONS)).rejects.toThrow(
        TypeError,
      );
    });
  });

  describe('token API', () => {
    it('repond 500 MISSING_API_TOKEN quand aucun token n est configure', async () => {
      const upstream = stubUpstream(() => HttpResponse.json({}));

      const response = await proxyClanResource('#2PP', '');
      const body = await readError(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('MISSING_API_TOKEN');
      expect(body.error.message.length).toBeGreaterThan(0);
      expect(upstream.requests).toHaveLength(0);
    });

    it('lit le token depuis CLASH_ROYALE_API_TOKEN', async () => {
      vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'env-token');
      const upstream = stubUpstream(() => HttpResponse.json({ ok: true }));

      const response = await proxyClanResource('#2PP', '');

      expect(response.status).toBe(200);
      expect(upstream.requests[0]?.headers.get('authorization')).toBe('Bearer env-token');
    });

    it('privilegie le token passe en option', async () => {
      vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'env-token');
      const upstream = stubUpstream(() => HttpResponse.json({ ok: true }));

      await proxyClanResource('#2PP', '', { apiToken: 'option-token' });

      expect(upstream.requests[0]?.headers.get('authorization')).toBe(
        'Bearer option-token',
      );
    });
  });

  describe('appel amont', () => {
    it('normalise et encode le tag dans l URL Supercell', async () => {
      const upstream = stubUpstream(() => HttpResponse.json({ ok: true }));

      await proxyClanResource(' 2opp ', '', TOKEN_OPTIONS);

      expect(upstream.requests[0]?.url).toBe(`${SUPERCELL_API_BASE_URL}/clans/%2320PP`);
    });

    it('ajoute le sous-chemin currentriverrace', async () => {
      const upstream = stubUpstream(() => HttpResponse.json({ ok: true }));

      await proxyClanResource('#2PP', '/currentriverrace', TOKEN_OPTIONS);

      expect(upstream.requests[0]?.url).toBe(
        `${SUPERCELL_API_BASE_URL}/clans/%232PP/currentriverrace`,
      );
    });

    it('ajoute le sous-chemin riverracelog', async () => {
      const upstream = stubUpstream(() => HttpResponse.json({ ok: true }));

      await proxyClanResource('#2PP', '/riverracelog', TOKEN_OPTIONS);

      expect(upstream.requests[0]?.url).toBe(
        `${SUPERCELL_API_BASE_URL}/clans/%232PP/riverracelog`,
      );
    });

    it('envoie l en-tete Accept application/json', async () => {
      const upstream = stubUpstream(() => HttpResponse.json({ ok: true }));

      await proxyClanResource('#2PP', '', TOKEN_OPTIONS);

      expect(upstream.requests[0]?.headers.get('accept')).toBe('application/json');
    });
  });

  describe('succes', () => {
    it('retransmet le JSON de Supercell en 200', async () => {
      const payload = { tag: '#2PP', name: 'Test Clan', members: 3 };
      stubUpstream(() => HttpResponse.json(payload));

      const response = await proxyClanResource('#2PP', '', TOKEN_OPTIONS);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(payload);
    });

    it('ne divulgue jamais le token dans la reponse', async () => {
      stubUpstream(() => HttpResponse.json({ ok: true }));

      const response = await proxyClanResource('#2PP', '', {
        apiToken: 'super-secret-token',
      });

      expect(await response.text()).not.toContain('super-secret-token');
    });
  });

  describe('mapping des erreurs amont', () => {
    it('mappe 404 vers CLAN_NOT_FOUND', async () => {
      stubUpstream(
        () =>
          new HttpResponse(JSON.stringify({ reason: 'notFound' }), {
            status: 404,
          }),
      );

      const response = await proxyClanResource('#2PP', '', TOKEN_OPTIONS);
      const body = await readError(response);

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('CLAN_NOT_FOUND');
      expect(body.error.message.length).toBeGreaterThan(0);
    });

    it('mappe 429 vers RATE_LIMITED', async () => {
      stubUpstream(() => new HttpResponse(null, { status: 429 }));

      const response = await proxyClanResource('#2PP', '', TOKEN_OPTIONS);
      const body = await readError(response);

      expect(response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(body.error.message.length).toBeGreaterThan(0);
    });

    it('mappe 500 vers UPSTREAM_ERROR en 502', async () => {
      stubUpstream(() => new HttpResponse('upstream-secret-details', { status: 500 }));

      const response = await proxyClanResource('#2PP', '', TOKEN_OPTIONS);
      const text = await response.clone().text();
      const body = await readError(response);

      expect(response.status).toBe(502);
      expect(body.error.code).toBe('UPSTREAM_ERROR');
      expect(body.error.message.length).toBeGreaterThan(0);
      // L'erreur brute de Supercell ne doit jamais fuiter.
      expect(text).not.toContain('upstream-secret-details');
    });

    it('mappe 503 vers UPSTREAM_ERROR en 502', async () => {
      stubUpstream(() => new HttpResponse(null, { status: 503 }));

      const response = await proxyClanResource('#2PP', '', TOKEN_OPTIONS);
      const body = await readError(response);

      expect(response.status).toBe(502);
      expect(body.error.code).toBe('UPSTREAM_ERROR');
    });

    it('mappe une panne reseau vers UPSTREAM_TIMEOUT en 504', async () => {
      stubUpstream(() => HttpResponse.error());

      const response = await proxyClanResource('#2PP', '', TOKEN_OPTIONS);
      const body = await readError(response);

      expect(response.status).toBe(504);
      expect(body.error.code).toBe('UPSTREAM_TIMEOUT');
      expect(body.error.message.length).toBeGreaterThan(0);
    });

    it('mappe un depassement du timeout vers UPSTREAM_TIMEOUT en 504', async () => {
      stubUpstream(async () => {
        await delay(300);
        return HttpResponse.json({ ok: true });
      });

      const response = await proxyClanResource('#2PP', '', {
        apiToken: 'test-token',
        timeoutMs: 20,
      });
      const body = await readError(response);

      expect(response.status).toBe(504);
      expect(body.error.code).toBe('UPSTREAM_TIMEOUT');
    });
  });
});
