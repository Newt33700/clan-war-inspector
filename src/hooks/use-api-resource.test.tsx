/**
 * Tests du hook useApiResource (US 3.1) - perimetre Stryker.
 * Les appels reseau passent par les handlers MSW globaux du proxy mocke.
 */

import { renderHook, waitFor } from '@testing-library/react';
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
    expect(result.current).toEqual({ status: 'idle' });
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
      expect(result.current).toEqual({ status: 'idle' });
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
});
