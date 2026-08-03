/**
 * Tests du Server Component /meteo (US 12, "Consistency Trend").
 * Voir dashboard/page.test.tsx pour le detail du choix de mock (Supercell
 * amont plutot que `setMockResponse`, reserve au rechargement client).
 */

import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import { mockServer } from '@/mocks/server';
import { clearClanResourceCache } from '@/lib/server-clan-resource';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/meteo',
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

import MeteoPage from './page';

async function renderPage(searchParams: { clan?: string } = {}) {
  const jsx = await MeteoPage({ searchParams: Promise.resolve(searchParams) });
  render(jsx);
}

const CLAN = {
  tag: '#20QRV',
  name: 'Clan Meteo',
  memberList: [
    { tag: '#ROC', name: 'Roc Alice', role: 'member' },
    { tag: '#DECRO', name: 'Decro Bob', role: 'member' },
  ],
};

function week(participants: { tag: string; battlesPlayed: number }[]) {
  return {
    seasonId: 1,
    sectionIndex: 1,
    standings: [
      {
        clan: {
          tag: '#20QRV',
          participants: participants.map((p) => ({
            tag: p.tag,
            name: p.tag,
            decksUsed: p.battlesPlayed,
          })),
        },
      },
    ],
  };
}

const LOG = {
  items: [
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 4 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 8 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 15 },
      { tag: '#DECRO', battlesPlayed: 12 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 16 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 16 },
    ]),
  ],
};

describe('MeteoPage', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'meteo-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearClanResourceCache();
  });

  it('affiche le formulaire de recherche quand aucun clan n est actif', async () => {
    await renderPage();

    expect(screen.getByRole('form', { name: /recherche de clan/i })).toBeInTheDocument();
  });

  it('classe Decrocheur avant Le Roc, avec un sparkline colore par profil', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        if (request.url.includes('riverracelog')) {
          return HttpResponse.json(LOG);
        }
        return HttpResponse.json(CLAN);
      }),
    );

    await renderPage({ clan: '#20QRV' });

    const rows = screen.getAllByTestId('weather-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('Decro Bob')).toBeInTheDocument();
    expect(within(rows[0]!).getByText(/decrocheur/i)).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Roc Alice')).toBeInTheDocument();
  });
});
