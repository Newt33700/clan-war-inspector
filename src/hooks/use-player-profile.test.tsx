/**
 * Tests du hook usePlayerProfile (US 9) : anti-spam (un seul appel par
 * tag) et memoisation (rouvrir un tag deja consulte ne refetch pas).
 */

import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { mockServer } from '@/mocks/server';
import { usePlayerProfile } from './use-player-profile';

const PLAYER_PAYLOAD = {
  tag: '#P1',
  name: 'Joueur 1',
  role: 'member',
  expLevel: 10,
  donations: 5,
};

describe('usePlayerProfile', () => {
  it('reste au repos quand le tag est null', () => {
    const { result } = renderHook(() => usePlayerProfile(null));
    expect(result.current.status).toBe('idle');
  });

  it('ne fait aucun appel reseau tant qu aucun tag n est fourni', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => usePlayerProfile(null));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('charge le profil au clic (tag fourni) et expose loading puis success', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => HttpResponse.json(PLAYER_PAYLOAD)),
    );
    const { result } = renderHook(() => usePlayerProfile('#P1'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current).toMatchObject({
      status: 'success',
      profile: { tag: '#P1', name: 'Joueur 1' },
    });
  });

  it('ne refait pas d appel si on reclique sur le meme tag apres fermeture (cache)', async () => {
    let calls = 0;
    mockServer.use(
      http.get('*/api/players/:playerTag', () => {
        calls += 1;
        return HttpResponse.json(PLAYER_PAYLOAD);
      }),
    );
    const { result, rerender } = renderHook(
      ({ tag }: { tag: string | null }) => usePlayerProfile(tag),
      {
        initialProps: { tag: '#P1' as string | null },
      },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(calls).toBe(1);

    // Fermeture du panneau (tag repasse a null).
    rerender({ tag: null });
    expect(result.current.status).toBe('idle');

    // Reouverture du meme joueur.
    rerender({ tag: '#P1' });
    expect(result.current.status).toBe('success');
    expect(calls).toBe(1);
  });

  it('refetch un tag different, jamais consulte auparavant', async () => {
    let calls = 0;
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        calls += 1;
        return HttpResponse.json({ ...PLAYER_PAYLOAD, tag: `#${params.playerTag}` });
      }),
    );
    const { result, rerender } = renderHook(
      ({ tag }: { tag: string | null }) => usePlayerProfile(tag),
      {
        initialProps: { tag: '#P1' as string | null },
      },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender({ tag: '#P2' });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(calls).toBe(2);
  });

  it('expose une erreur et la met aussi en cache', async () => {
    let calls = 0;
    mockServer.use(
      http.get('*/api/players/:playerTag', () => {
        calls += 1;
        return HttpResponse.json(
          { error: { code: 'PLAYER_NOT_FOUND', message: 'Aucun joueur.' } },
          { status: 404 },
        );
      }),
    );
    const { result, rerender } = renderHook(
      ({ tag }: { tag: string | null }) => usePlayerProfile(tag),
      {
        initialProps: { tag: '#P1' as string | null },
      },
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({ message: 'Aucun joueur.' });

    rerender({ tag: null });
    rerender({ tag: '#P1' });
    expect(result.current.status).toBe('error');
    expect(calls).toBe(1);
  });

  it('signale une panne reseau', async () => {
    mockServer.use(http.get('*/api/players/:playerTag', () => HttpResponse.error()));
    const { result } = renderHook(() => usePlayerProfile('#P1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({
      message: 'Impossible de joindre le serveur.',
    });
  });

  it('signale un tag invalide sans appeler l API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => usePlayerProfile('   '));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({ message: 'Tag joueur invalide.' });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('signale un profil illisible (reponse sans tag exploitable)', async () => {
    mockServer.use(http.get('*/api/players/:playerTag', () => HttpResponse.json({})));
    const { result } = renderHook(() => usePlayerProfile('#P1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('ne plante pas quand le composant est demonte en plein vol', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(PLAYER_PAYLOAD);
      }),
    );
    const { unmount } = renderHook(() => usePlayerProfile('#P1'));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 80));
  });

  it('n ecrase ni l etat ni le cache avec une reponse perimee, abortee au changement de tag', async () => {
    // #P1 ne repond jamais tout seul : resolu tardivement, une fois deja
    // passe a #P2, pour verifier qu'il n'a plus voix au chapitre.
    let resolveStaleP1!: (response: Response) => void;
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        if (params.playerTag === '#P1') {
          return new Promise<Response>((resolve) => (resolveStaleP1 = resolve));
        }
        return HttpResponse.json({ ...PLAYER_PAYLOAD, tag: '#P2', name: 'Joueur 2' });
      }),
    );
    const { result, rerender } = renderHook(
      ({ tag }: { tag: string | null }) => usePlayerProfile(tag),
      { initialProps: { tag: '#P1' as string | null } },
    );
    expect(result.current.status).toBe('loading');
    // Attend que la requete #P1 atteigne reellement MSW (interception
    // asynchrone) avant de changer de tag : sinon l'abort survient avant
    // meme que la requete soit "en vol", ce qui ne testerait rien.
    await waitFor(() => expect(resolveStaleP1).toBeDefined());

    rerender({ tag: '#P2' });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({ profile: { tag: '#P2' } });

    resolveStaleP1(
      HttpResponse.json({ ...PLAYER_PAYLOAD, tag: '#P1-perime', name: 'Perime' }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current).toMatchObject({ profile: { tag: '#P2' } });

    // #P1 n'a jamais ete mis en cache (requete abandonnee) : le rouvrir
    // doit redemarrer un vrai chargement, pas servir un resultat perime.
    rerender({ tag: '#P1' });
    expect(result.current.status).toBe('loading');
  });
});
