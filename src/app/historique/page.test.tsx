/**
 * Tests du Server Component /historique (US 13.2/13.6, Epique 13).
 * Voir dashboard/page.test.tsx pour le detail du choix de mock (Supercell
 * amont plutot que `setMockResponse`, reserve au rechargement client).
 */

import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import { FIXTURE_FULL_CLAN, FIXTURE_RIVER_RACE_LOG } from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/historique',
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

import HistoriquePage from './page';

async function renderPage(searchParams: { clan?: string } = {}) {
  const jsx = await HistoriquePage({ searchParams: Promise.resolve(searchParams) });
  render(jsx);
}

describe('HistoriquePage', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'historique-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('affiche le formulaire de recherche quand aucun clan n est actif', async () => {
    await renderPage();

    expect(screen.getByRole('form', { name: /recherche de clan/i })).toBeInTheDocument();
  });

  it('affiche l historique deja resolu cote serveur, sans etat de chargement', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        if (request.url.includes('riverracelog')) {
          return HttpResponse.json(FIXTURE_RIVER_RACE_LOG);
        }
        return HttpResponse.json(FIXTURE_FULL_CLAN);
      }),
    );

    await renderPage({ clan: '#20PP' });

    expect(screen.getAllByTestId('history-row').length).toBeGreaterThan(0);
  });
});
