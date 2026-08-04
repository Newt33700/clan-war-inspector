/**
 * Tests du hook useNewMemberReliability (US 11) : enrichissement
 * sequentiel de /api/players/{tag}, jamais en parallele (risque de 429
 * Supercell des qu'un clan a plusieurs nouveaux membres a la fois).
 */

import { renderHook, waitFor } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { mockServer } from '@/mocks/server';
import { useNewMemberReliability } from './use-new-member-reliability';

const PROFILE_A = {
  tag: '#A',
  battleCount: 5000,
  badges: [{ name: 'ClanWarWins', progress: 0 }],
};
const PROFILE_B = {
  tag: '#B',
  battleCount: 2000,
  badges: [{ name: 'ClanWarWins', progress: 60 }],
};

describe('useNewMemberReliability', () => {
  it('retourne une map vide sans tag, sans appel reseau', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useNewMemberReliability([]));
    expect(result.current.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('place tous les tags en loading des le depart', () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => new Promise(() => undefined)),
    );
    const { result } = renderHook(() => useNewMemberReliability(['#A', '#B']));
    expect(result.current.get('#A')).toEqual({ status: 'loading' });
    expect(result.current.get('#B')).toEqual({ status: 'loading' });
  });

  it('enrichit chaque tag et expose ses stats de fiabilite au succes', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) =>
        HttpResponse.json(params.playerTag === '#A' ? PROFILE_A : PROFILE_B),
      ),
    );
    const { result } = renderHook(() => useNewMemberReliability(['#A', '#B']));

    await waitFor(() => {
      expect(result.current.get('#A')).toEqual({
        status: 'success',
        stats: { battleCount: 5000, clanWarWins: 0 },
      });
    });
    await waitFor(() => {
      expect(result.current.get('#B')).toEqual({
        status: 'success',
        stats: { battleCount: 2000, clanWarWins: 60 },
      });
    });
  });

  it('n appelle jamais un 2e tag avant que le 1er ait repondu (sequentiel, pas parallele)', async () => {
    let calls = 0;
    let resolveFirst!: (response: Response) => void;
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        calls += 1;
        if (params.playerTag === '#A') {
          return new Promise<Response>((resolve) => (resolveFirst = resolve));
        }
        return HttpResponse.json(PROFILE_B);
      }),
    );

    renderHook(() => useNewMemberReliability(['#A', '#B', '#C']));

    // Le 1er appel part immediatement, mais rien d'autre tant qu'il pend.
    await waitFor(() => expect(resolveFirst).toBeDefined());
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(1);

    resolveFirst(HttpResponse.json(PROFILE_A));

    // Une fois le 1er resolu, le 2e (puis le 3e) doit suivre.
    await waitFor(() => expect(calls).toBe(3));
  });

  it('expose une erreur pour un tag en echec, sans bloquer les suivants', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        if (params.playerTag === '#A') {
          return HttpResponse.json(
            { error: { code: 'PLAYER_NOT_FOUND', message: 'Aucun joueur.' } },
            { status: 404 },
          );
        }
        return HttpResponse.json(PROFILE_B);
      }),
    );
    const { result } = renderHook(() => useNewMemberReliability(['#A', '#B']));

    await waitFor(() =>
      expect(result.current.get('#A')).toEqual({
        status: 'error',
        message: 'Aucun joueur.',
      }),
    );
    await waitFor(() =>
      expect(result.current.get('#B')).toMatchObject({ status: 'success' }),
    );
  });

  it('signale une panne reseau', async () => {
    mockServer.use(http.get('*/api/players/:playerTag', () => HttpResponse.error()));
    const { result } = renderHook(() => useNewMemberReliability(['#A']));
    await waitFor(() =>
      expect(result.current.get('#A')).toEqual({
        status: 'error',
        message: 'Impossible de joindre le serveur.',
      }),
    );
  });

  it('signale un profil illisible (reponse sans donnees exploitables)', async () => {
    mockServer.use(http.get('*/api/players/:playerTag', () => HttpResponse.json(null)));
    const { result } = renderHook(() => useNewMemberReliability(['#A']));
    await waitFor(() =>
      expect(result.current.get('#A')).toEqual({
        status: 'error',
        message: 'Profil joueur illisible.',
      }),
    );
  });

  it('vide la map quand la liste de tags redevient vide', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => HttpResponse.json(PROFILE_A)),
    );
    const { result, rerender } = renderHook(
      ({ tags }: { tags: string[] }) => useNewMemberReliability(tags),
      { initialProps: { tags: ['#A'] } },
    );
    await waitFor(() =>
      expect(result.current.get('#A')).toMatchObject({ status: 'success' }),
    );

    rerender({ tags: [] });

    expect(result.current.size).toBe(0);
  });

  it('transmet le signal d annulation a chaque appel fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    mockServer.use(
      http.get('*/api/players/:playerTag', () => HttpResponse.json(PROFILE_A)),
    );
    renderHook(() => useNewMemberReliability(['#A']));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    fetchSpy.mockRestore();
  });

  it('arrete la sequence au demontage en plein vol : jamais de fetch pour les tags restants', async () => {
    // Espionne `fetch` lui-meme (pas le compteur cote handler MSW) : une
    // requete demarree avec un signal deja aborte se rejette avant meme
    // d'atteindre le reseau, donc le seul moyen fiable de detecter une
    // tentative pour #B est de verifier que `fetch` n'a jamais ete
    // rappele, pas que MSW n'a jamais repondu.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    let resolveFirst!: (response: Response) => void;
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        if (params.playerTag === '#A') {
          return new Promise<Response>((resolve) => (resolveFirst = resolve));
        }
        return HttpResponse.json(PROFILE_B);
      }),
    );

    const { unmount } = renderHook(() => useNewMemberReliability(['#A', '#B']));
    await waitFor(() => expect(resolveFirst).toBeDefined());
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();
    // Reponse tardive du 1er appel, arrivant apres le demontage : ne doit
    // jamais relancer la boucle vers le 2e tag.
    resolveFirst(HttpResponse.json(PROFILE_A));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it('signale un tag invalide sans appeler l API pour ce tag', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useNewMemberReliability(['   ']));
    await waitFor(() =>
      expect(result.current.get('   ')).toEqual({
        status: 'error',
        message: 'Tag joueur invalide.',
      }),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('relance l enrichissement quand la liste de tags change', async () => {
    let calls = 0;
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        calls += 1;
        return HttpResponse.json(params.playerTag === '#A' ? PROFILE_A : PROFILE_B);
      }),
    );
    const { result, rerender } = renderHook(
      ({ tags }: { tags: string[] }) => useNewMemberReliability(tags),
      { initialProps: { tags: ['#A'] } },
    );
    await waitFor(() =>
      expect(result.current.get('#A')).toMatchObject({ status: 'success' }),
    );
    expect(calls).toBe(1);

    rerender({ tags: ['#B'] });
    expect(result.current.get('#A')).toBeUndefined();
    await waitFor(() =>
      expect(result.current.get('#B')).toMatchObject({ status: 'success' }),
    );
    expect(calls).toBe(2);
  });

  it('ne plante pas quand le composant est demonte en plein vol', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(PROFILE_A);
      }),
    );
    const { unmount } = renderHook(() => useNewMemberReliability(['#A', '#B']));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
});
