/**
 * Tests du Server Component /dashboard (US 13.2/13.6, Epique 13).
 *
 * Le fetch initial appelle directement `proxyClanResource` (pas de
 * Route Handler HTTP intermediaire) : le reseau amont Supercell est
 * mocke, comme pour les tests des Route Handlers eux-memes -- pas
 * `setMockResponse`, qui ne couvre que le proxy interne `/api/clans/...`
 * utilise par les rechargements cote client (`refetch`).
 */

import { render, screen, waitFor, within } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPERCELL_API_BASE_URL } from '@/app/api/_lib/supercell';
import { setMockResponse } from '@/mocks/handlers';
import { FIXTURE_FULL_CLAN, FIXTURE_RIVER_RACE_IDLE } from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { clearClanResourceCache } from '@/lib/server-clan-resource';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

const cookieGetMock = vi.fn((): { value: string } | undefined => undefined);
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: cookieGetMock }),
}));

import DashboardPage from './page';

async function renderPage(searchParams: { clan?: string } = {}) {
  const jsx = await DashboardPage({ searchParams: Promise.resolve(searchParams) });
  render(jsx);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.stubEnv('CLASH_ROYALE_API_TOKEN', 'dashboard-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cookieGetMock.mockReturnValue(undefined);
    // Le cache de fetchClanResource (US 15.1) est en memoire, partage entre
    // tous les tests du fichier : sans ce reset, un succes mis en cache par
    // un test fuirait vers le suivant, meme avec un mock MSW different.
    clearClanResourceCache();
  });

  it('affiche le formulaire de recherche quand aucun clan n est actif', async () => {
    await renderPage();

    expect(screen.getByRole('form', { name: /recherche de clan/i })).toBeInTheDocument();
    expect(
      screen.getByText(/saisissez le tag ou le nom de votre clan/i),
    ).toBeInTheDocument();
  });

  it('resout le clan depuis le cookie quand l URL n en porte pas', async () => {
    cookieGetMock.mockReturnValue({ value: encodeURIComponent('#20PP') });
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        expect(request.url).toContain('20PP');
        return HttpResponse.json(FIXTURE_FULL_CLAN);
      }),
    );

    await renderPage();

    expect(await screen.findAllByTestId('member-row')).toHaveLength(3);
  });

  it('priorise le tag de l URL sur le cookie', async () => {
    cookieGetMock.mockReturnValue({ value: encodeURIComponent('#OTHER') });
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        expect(request.url).toContain('20PP');
        return HttpResponse.json(FIXTURE_FULL_CLAN);
      }),
    );

    await renderPage({ clan: '#20PP' });

    expect(await screen.findAllByTestId('member-row')).toHaveLength(3);
  });

  it('rend directement les membres sans etat de chargement intermediaire (pas de flash)', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () =>
        HttpResponse.json(FIXTURE_FULL_CLAN),
      ),
    );

    await renderPage({ clan: '#20PP' });

    // Deja present au tout premier rendu, sans "findBy" ni "waitFor".
    expect(screen.getAllByTestId('member-row')).toHaveLength(3);
    expect(screen.getByTestId('clan-header')).toBeInTheDocument();
  });

  it('affiche une erreur et permet de reessayer quand le clan est introuvable', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, () =>
        HttpResponse.json({ reason: 'notFound' }, { status: 404 }),
      ),
    );

    await renderPage({ clan: '#20PP' });

    expect(screen.getByRole('alert')).toHaveTextContent(/aucun clan/i);

    // Le reessai relance un vrai fetch cote client, via le proxy interne.
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(await screen.findAllByTestId('member-row')).toHaveLength(3);
  });

  it('ne fetch pas la guerre en cours ni l historique quand le clan echoue', async () => {
    let warCalls = 0;
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        if (request.url.includes('currentriverrace')) {
          warCalls += 1;
        }
        return HttpResponse.json({ reason: 'notFound' }, { status: 404 });
      }),
    );

    await renderPage({ clan: '#20PP' });

    expect(warCalls).toBe(0);
  });

  it('affiche la guerre en cours deja resolue cote serveur', async () => {
    mockServer.use(
      http.get(`${SUPERCELL_API_BASE_URL}/clans/*`, ({ request }) => {
        if (request.url.includes('currentriverrace')) {
          return HttpResponse.json(FIXTURE_RIVER_RACE_IDLE);
        }
        if (request.url.includes('riverracelog')) {
          return HttpResponse.json({ items: [] });
        }
        return HttpResponse.json(FIXTURE_FULL_CLAN);
      }),
    );

    await renderPage({ clan: '#20PP' });

    const warSection = screen
      .getByRole('heading', { name: /guerre en cours/i })
      .closest('section')!;
    await waitFor(() => {
      expect(
        within(warSection).getByText(/n.est pas en guerre actuellement/i),
      ).toBeInTheDocument();
    });
  });
});
