/**
 * Tests du Server Component /nouveaux-membres (US 11, "Sas de
 * Quarantaine"). Voir dashboard/page.test.tsx pour le detail du choix de
 * mock (Supercell amont). Deux couches MSW combinees, comme demande par
 * la US : le clan + riverracelog (couche Supercell amont, resolus cote
 * serveur) et les profils /players/{tag} des nouveaux membres (couche
 * proxy interne, appelee cote client par `useNewMemberReliability`).
 */

import { render, screen, waitFor, within } from '@/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import {
  FIXTURE_NEW_MEMBER_GOOD_PROFILE,
  FIXTURE_NEW_MEMBER_RISKY_PROFILE,
  FIXTURE_QUARANTINE_CLAN,
  FIXTURE_QUARANTINE_LOG,
} from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { clearClanResourceCache } from '@/lib/server-clan-resource';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/nouveaux-membres',
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

import NouveauxMembresPage from './page';

async function renderPage(searchParams: { clan?: string } = {}) {
  const jsx = await NouveauxMembresPage({ searchParams: Promise.resolve(searchParams) });
  render(jsx);
}

describe('NouveauxMembresPage', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'nouveaux-membres-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearClanResourceCache();
  });

  it('affiche le formulaire de recherche quand aucun clan n est actif', async () => {
    await renderPage();

    expect(screen.getByRole('form', { name: /recherche de clan/i })).toBeInTheDocument();
  });

  it('isole les 2 nouveaux membres, ignore les 3 anciens, et applique la regle de fiabilite', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        if (request.url.includes('riverracelog')) {
          return HttpResponse.json(FIXTURE_QUARANTINE_LOG);
        }
        return HttpResponse.json(FIXTURE_QUARANTINE_CLAN);
      }),
      http.get('*/api/players/:playerTag', ({ params }) =>
        HttpResponse.json(
          params.playerTag === '#NEW1'
            ? FIXTURE_NEW_MEMBER_RISKY_PROFILE
            : FIXTURE_NEW_MEMBER_GOOD_PROFILE,
        ),
      ),
    );

    await renderPage({ clan: '#20QRV' });

    // Les 3 anciens (avec historique) ne sont jamais dans le sas.
    expect(screen.queryByText('Veteran 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Veteran 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Veteran 3')).not.toBeInTheDocument();

    // Les 2 nouveaux (sans historique) y sont, avec leur feu respectif.
    const riskyCard = (await screen.findByText('Recrue Risquee')).closest(
      '[data-testid="quarantine-card"]',
    ) as HTMLElement;
    await waitFor(() => {
      expect(within(riskyCard).getByText(/à risque/i)).toBeInTheDocument();
    });
    expect(
      within(riskyCard).getByRole('button', { name: /copier tag pour kick/i }),
    ).toBeInTheDocument();

    const goodCard = (await screen.findByText('Recrue Fiable')).closest(
      '[data-testid="quarantine-card"]',
    ) as HTMLElement;
    await waitFor(() => {
      expect(within(goodCard).getByText(/bon profil/i)).toBeInTheDocument();
    });
    expect(
      within(goodCard).queryByRole('button', { name: /copier tag pour kick/i }),
    ).not.toBeInTheDocument();
  });
});
