/**
 * Tests du Server Component /rh (US 13.2/13.6, Epique 13). Voir
 * dashboard/page.test.tsx pour le detail du choix de mock.
 */

import { render, screen, within } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import { FIXTURE_FULL_CLAN, FIXTURE_RIVER_RACE_IN_PROGRESS } from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { clearClanResourceCache } from '@/lib/server-clan-resource';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/rh',
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

import RhPage from './page';

async function renderPage(searchParams: { clan?: string } = {}) {
  const jsx = await RhPage({ searchParams: Promise.resolve(searchParams) });
  render(jsx);
}

describe('RhPage', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'rh-token');
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // Cache en memoire de fetchClanResource (US 15.1), partage entre tests.
    clearClanResourceCache();
  });

  it('affiche le formulaire de recherche quand aucun clan n est actif', async () => {
    await renderPage();

    expect(screen.getByRole('form', { name: /recherche de clan/i })).toBeInTheDocument();
  });

  it('affiche la regle A expulser deja resolue cote serveur, sans etat de chargement', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        if (request.url.includes('currentriverrace')) {
          return HttpResponse.json(FIXTURE_RIVER_RACE_IN_PROGRESS);
        }
        if (request.url.includes('riverracelog')) {
          return HttpResponse.json({ items: [] });
        }
        return HttpResponse.json(FIXTURE_FULL_CLAN);
      }),
    );

    await renderPage({ clan: '#20PP' });

    const purgeSection = screen
      .getByRole('heading', { name: /^à expulser$/i })
      .closest('section')!;
    // Joueur 3 (role member, 5/16 combats) est sous le seuil par defaut (8).
    expect(within(purgeSection).getByText('Joueur 3')).toBeInTheDocument();
  });
});
