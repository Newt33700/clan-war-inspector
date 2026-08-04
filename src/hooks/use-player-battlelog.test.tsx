/**
 * Tests du hook usePlayerBattlelog (retour utilisateur 2026-08-04) : meme
 * contrat anti-spam et memoisation que usePlayerProfile.
 */

import { renderHook, waitFor } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { mockServer } from '@/mocks/server';
import { usePlayerBattlelog } from './use-player-battlelog';

const BATTLELOG_PAYLOAD = [
  { team: [{ crowns: 3 }], opponent: [{ crowns: 0 }] },
  { team: [{ crowns: 0 }], opponent: [{ crowns: 2 }] },
];

describe('usePlayerBattlelog', () => {
  it('reste au repos quand le tag est null', () => {
    const { result } = renderHook(() => usePlayerBattlelog(null));
    expect(result.current.status).toBe('idle');
  });

  it('ne fait aucun appel reseau tant qu aucun tag n est fourni', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderHook(() => usePlayerBattlelog(null));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('charge les combats recents et expose loading puis success', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag/battlelog', () =>
        HttpResponse.json(BATTLELOG_PAYLOAD),
      ),
    );
    const { result } = renderHook(() => usePlayerBattlelog('#P1'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toEqual({
      status: 'success',
      battles: [{ result: 'win' }, { result: 'loss' }],
    });
  });

  it('ne refait pas d appel si on reclique sur le meme tag (cache)', async () => {
    let calls = 0;
    mockServer.use(
      http.get('*/api/players/:playerTag/battlelog', () => {
        calls += 1;
        return HttpResponse.json(BATTLELOG_PAYLOAD);
      }),
    );
    const { result, rerender } = renderHook(
      ({ tag }: { tag: string | null }) => usePlayerBattlelog(tag),
      { initialProps: { tag: '#P1' as string | null } },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(calls).toBe(1);

    rerender({ tag: null });
    rerender({ tag: '#P1' });
    expect(result.current.status).toBe('success');
    expect(calls).toBe(1);
  });

  it('expose une erreur sur reponse HTTP en echec', async () => {
    mockServer.use(
      http.get(
        '*/api/players/:playerTag/battlelog',
        () => new HttpResponse(null, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => usePlayerBattlelog('#P1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('signale une panne reseau', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag/battlelog', () => HttpResponse.error()),
    );
    const { result } = renderHook(() => usePlayerBattlelog('#P1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('signale un tag invalide sans appeler l API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => usePlayerBattlelog('   '));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('ne plante pas quand le composant est demonte en plein vol', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag/battlelog', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(BATTLELOG_PAYLOAD);
      }),
    );
    const { unmount } = renderHook(() => usePlayerBattlelog('#P1'));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
});
