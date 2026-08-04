/**
 * Tests du hook useApiResource (US 3.1) - perimetre Stryker.
 * Les appels reseau passent par les handlers MSW globaux du proxy mocke.
 */

import { act, renderHook, waitFor } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { setMockResponse } from '@/mocks/handlers';
import { FIXTURE_FULL_CLAN } from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { readApiErrorMessage, useApiResource } from './use-api-resource';

describe('readApiErrorMessage', () => {
  it('extrait le message du format d erreur du proxy', () => {
    const payload = { error: { code: 'CLAN_NOT_FOUND', message: 'Aucun clan.' } };
    expect(readApiErrorMessage(payload, 404)).toBe('Aucun clan.');
  });

  it.each([
    ['payload non objet', 'oops'],
    ['payload null', null],
    ['error non objet', { error: 'boom' }],
    ['message non string', { error: { message: 42 } }],
    ['message tableau (length trompeuse)', { error: { message: ['piege'] } }],
    ['message vide', { error: { message: '' } }],
  ])('retombe sur le code HTTP (%s)', (_label, payload) => {
    expect(readApiErrorMessage(payload, 502)).toBe('Erreur 502');
  });
});

describe('useApiResource', () => {
  it('reste au repos quand le chemin est null', () => {
    const { result } = renderHook(() => useApiResource(null));
    expect(result.current.status).toBe('idle');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('passe par loading puis success avec les donnees du proxy', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    const { result } = renderHook(() => useApiResource('/api/clans/%2320PP'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current).toMatchObject({
      data: { tag: '#20PP', name: 'Test Clan' },
    });
  });

  it('expose le code HTTP quand le corps d erreur est inconnu', async () => {
    // Mock non configure : le handler global repond 404 { reason }.
    const { result } = renderHook(() => useApiResource('/api/clans/%2320PP'));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current).toMatchObject({ message: 'Erreur 404' });
  });

  it('affiche le message stable du proxy quand il est present', async () => {
    mockServer.use(
      http.get('*/api/clans/:clanTag', () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Limite atteinte.' } },
          { status: 429 },
        ),
      ),
    );
    const { result } = renderHook(() => useApiResource('/api/clans/%2320PP'));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current).toMatchObject({ message: 'Limite atteinte.' });
  });

  it('signale une panne reseau', async () => {
    mockServer.use(http.get('*/api/clans/:clanTag', () => HttpResponse.error()));
    const { result } = renderHook(() => useApiResource('/api/clans/%2320PP'));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current).toMatchObject({
      message: 'Impossible de joindre le serveur.',
    });
  });

  it('recharge quand le chemin change', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => useApiResource(path),
      { initialProps: { path: '/api/clans/%2320PP' } },
    );
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    rerender({ path: '/api/clans/%232PP' });
    expect(result.current.status).toBe('loading');
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('revient au repos quand le chemin repasse a null', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => useApiResource(path),
      { initialProps: { path: '/api/clans/%2320PP' as string | null } },
    );
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    rerender({ path: null });
    await waitFor(() => {
      expect(result.current.status).toBe('idle');
    });
  });

  it('refetch relance un chargement sur le meme chemin (US 6.3)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    const { result } = renderHook(() => useApiResource('/api/clans/%2320PP'));
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    // Le clan a disparu entre les deux appels : le refetch doit le refleter.
    mockServer.use(
      http.get('*/api/clans/:clanTag', () =>
        HttpResponse.json(
          { error: { code: 'CLAN_NOT_FOUND', message: 'Aucun clan.' } },
          { status: 404 },
        ),
      ),
    );

    act(() => {
      result.current.refetch();
    });
    expect(result.current.status).toBe('loading');
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current).toMatchObject({ message: 'Aucun clan.' });
  });

  it('refetch relance a nouveau apres un premier refetch deja aboutit', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    const { result } = renderHook(() => useApiResource('/api/clans/%2320PP'));
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.refetch();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    // Second refetch, une fois le premier deja retombe sur un etat stable :
    // doit repartir en chargement, pas rester bloque sur l'etat precedent.
    act(() => {
      result.current.refetch();
    });
    expect(result.current.status).toBe('loading');
  });

  it('refetch ne fait rien tant que le chemin est null', () => {
    const { result } = renderHook(() => useApiResource(null));

    act(() => {
      result.current.refetch();
    });

    expect(result.current.status).toBe('idle');
  });

  describe('seed (US 13.2, hydratation depuis un Server Component)', () => {
    it('affiche directement la donnee du seed sans passer par loading', () => {
      const { result } = renderHook(() =>
        useApiResource('/api/clans/%2320PP', {
          status: 'success',
          data: { tag: '#20PP', name: 'Test Clan' },
        }),
      );

      expect(result.current).toMatchObject({
        status: 'success',
        data: { tag: '#20PP', name: 'Test Clan' },
      });
    });

    it('ne refait pas d appel reseau au montage quand un seed est fourni', async () => {
      let calls = 0;
      mockServer.use(
        http.get('*/api/clans/:clanTag', () => {
          calls += 1;
          return HttpResponse.json(FIXTURE_FULL_CLAN);
        }),
      );

      renderHook(() =>
        useApiResource('/api/clans/%2320PP', {
          status: 'success',
          data: { tag: '#20PP', name: 'Test Clan' },
        }),
      );

      // Laisse le temps a un eventuel effet de fetch de se declencher.
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(calls).toBe(0);
    });

    it('refetch effectue un vrai appel reseau apres un seed', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      const { result } = renderHook(() =>
        useApiResource('/api/clans/%2320PP', {
          status: 'error',
          message: 'Erreur precedente (rendue par le serveur).',
        }),
      );
      expect(result.current.status).toBe('error');

      act(() => {
        result.current.refetch();
      });

      expect(result.current.status).toBe('loading');
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('recharge normalement si le chemin change apres un seed', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      const { result, rerender } = renderHook(
        ({ path }: { path: string | null }) =>
          useApiResource(path, { status: 'success', data: { tag: '#OLD' } }),
        { initialProps: { path: '/api/clans/%2320PP' as string | null } },
      );
      expect(result.current).toMatchObject({ data: { tag: '#OLD' } });

      rerender({ path: '/api/clans/%232PP' });

      expect(result.current.status).toBe('loading');
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });
  });

  it('ne plante pas quand le composant est demonte en plein vol', async () => {
    mockServer.use(
      http.get('*/api/clans/:clanTag', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({});
      }),
    );
    const { unmount } = renderHook(() => useApiResource('/api/clans/%2320PP'));
    unmount();
    // L'abort ne doit produire ni erreur non geree ni setState tardif.
    await new Promise((resolve) => setTimeout(resolve, 80));
  });

  it('n ecrase pas l etat avec le resultat d une requete perimee, abortee au changement de chemin', async () => {
    // La requete du premier chemin ne repond jamais toute seule : c'est
    // nous qui la faisons aboutir tardivement, une fois le chemin deja
    // repasse a `null`, pour verifier qu'elle n'a plus voix au chapitre.
    let resolveStaleRequest!: (response: Response) => void;
    mockServer.use(
      http.get(
        '*/api/clans/:clanTag',
        () => new Promise<Response>((resolve) => (resolveStaleRequest = resolve)),
      ),
    );
    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => useApiResource(path),
      { initialProps: { path: '/api/clans/%2320PP' as string | null } },
    );
    expect(result.current.status).toBe('loading');
    // Attend que la requete atteigne reellement MSW (interception
    // asynchrone) avant d'abandonner le chemin : sinon l'abort survient
    // avant meme que la requete soit "en vol", ce qui ne testerait rien.
    await waitFor(() => expect(resolveStaleRequest).toBeDefined());

    rerender({ path: null });
    expect(result.current.status).toBe('idle');

    resolveStaleRequest(HttpResponse.json({ tag: '#20PP-perime' }));
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Ni le succes ni l'erreur perimes ne doivent avoir ecrase l'etat
    // "idle" : la requete du chemin abandonne devait etre abortee.
    expect(result.current.status).toBe('idle');
  });
});
