/**
 * Tests du formulaire de recherche/selection de clan (US 13.3), extrait de
 * l'ancien ClanDashboard. Le reseau est mocke par MSW ; la navigation
 * Next.js (`useRouter`/`usePathname`) est mockee : ce composant ne fait
 * que demander une navigation, il ne rend plus lui-meme le dashboard.
 */

import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setMockResponse } from '@/mocks/handlers';
import { mockServer } from '@/mocks/server';

const replaceMock = vi.fn();
const usePathnameMock = vi.fn(() => '/dashboard');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => usePathnameMock(),
}));

import { ClanSearchForm } from './clan-search-form';

describe('ClanSearchForm', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.cookie = 'cwi_clan_tag=; Path=/; Max-Age=0';
    replaceMock.mockClear();
    usePathnameMock.mockReturnValue('/dashboard');
  });

  it('desactive le bouton immediatement quand le tag est invalide', async () => {
    render(<ClanSearchForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#2PZ');

    expect(screen.getByRole('button', { name: /inspecter/i })).toBeDisabled();
  });

  it('n affiche le message de format invalide qu apres une pause de frappe (US 6.5)', async () => {
    render(<ClanSearchForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#2PZ');
    expect(screen.queryByText(/tag invalide/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/tag invalide/i)).toBeInTheDocument();
    });
  });

  it('navigue vers la page courante avec ?clan=<tag> a la soumission', async () => {
    render(<ClanSearchForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#20PP');
    await user.click(screen.getByRole('button', { name: /inspecter/i }));

    expect(replaceMock).toHaveBeenCalledWith('/dashboard?clan=%2320PP');
  });

  it('navigue vers la page /historique courante en conservant son chemin', async () => {
    usePathnameMock.mockReturnValue('/historique');
    render(<ClanSearchForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#20PP');
    await user.click(screen.getByRole('button', { name: /inspecter/i }));

    expect(replaceMock).toHaveBeenCalledWith('/historique?clan=%2320PP');
  });

  it('memorise le tag en localStorage et en cookie a la soumission', async () => {
    render(<ClanSearchForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#20PP');
    await user.click(screen.getByRole('button', { name: /inspecter/i }));

    expect(window.localStorage.getItem('clan-war-inspector:last-clan-tag')).toBe('#20PP');
    expect(document.cookie).toContain('cwi_clan_tag=%2320PP');
  });

  describe('US 10.1 : recherche de clan par tag ou par nom', () => {
    async function typeQuery(query: string) {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/tag ou nom du clan/i), query);
      return user;
    }

    it('navigue directement quand la recherche par nom ne retourne qu un candidat', async () => {
      setMockResponse('clanSearch', {
        items: [{ tag: '#20PP', name: 'Chevreaux Team', members: 3 }],
      });
      render(<ClanSearchForm />);

      await typeQuery('Chevreaux Team');

      await waitFor(() => {
        expect(replaceMock).toHaveBeenCalledWith('/dashboard?clan=%2320PP');
      });
    });

    it('affiche une liste de candidats cliquable quand plusieurs clans correspondent', async () => {
      setMockResponse('clanSearch', {
        items: [
          { tag: '#2PYU', name: 'Chevreaux Team', members: 10 },
          { tag: '#2GVR', name: 'Chevreaux Legends', members: 20 },
        ],
      });
      render(<ClanSearchForm />);

      await typeQuery('Chevreaux');

      const candidates = await screen.findAllByTestId('clan-search-candidate');
      expect(candidates).toHaveLength(2);

      const user = userEvent.setup();
      await user.click(candidates[0]!);

      expect(replaceMock).toHaveBeenCalledWith('/dashboard?clan=%232PYU');
    });

    it('affiche un message distinct quand aucun clan ne correspond au nom', async () => {
      setMockResponse('clanSearch', { items: [] });
      render(<ClanSearchForm />);

      await typeQuery('Introuvable');

      expect(
        await screen.findByText(/aucun clan ne correspond à « introuvable »/i),
      ).toBeInTheDocument();
    });

    it('affiche une aide plutot qu un appel reseau pour une requete trop courte', async () => {
      const upstreamCalls: string[] = [];
      mockServer.use(
        http.get('*/api/clans', ({ request }) => {
          upstreamCalls.push(request.url);
          return HttpResponse.json({ items: [] });
        }),
      );
      render(<ClanSearchForm />);

      await typeQuery('ab');

      expect(
        await screen.findByText(/continuez à taper \(3 caractères minimum\)/i),
      ).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(upstreamCalls).toHaveLength(0);
    });

    it('continue de traiter un tag explicite (#...) comme un tag, pas une recherche', async () => {
      render(<ClanSearchForm />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#20PP');
      await user.click(screen.getByRole('button', { name: /inspecter/i }));

      expect(screen.queryByTestId('clan-search-candidate')).not.toBeInTheDocument();
    });
  });

  describe('repli quand un clan est deja actif (retour utilisateur du 2026-08-04)', () => {
    it('affiche le formulaire complet quand aucun clan n est actif', () => {
      render(<ClanSearchForm hasActiveClan={false} />);

      expect(screen.getByLabelText(/tag ou nom du clan/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /changer de clan/i }),
      ).not.toBeInTheDocument();
    });

    it('replie le formulaire derriere "Changer de clan" quand un clan est actif', () => {
      render(<ClanSearchForm hasActiveClan={true} />);

      expect(
        screen.getByRole('button', { name: /changer de clan/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/tag ou nom du clan/i)).not.toBeInTheDocument();
    });

    it('deplie le formulaire au clic sur "Changer de clan"', async () => {
      const user = userEvent.setup();
      render(<ClanSearchForm hasActiveClan={true} />);

      await user.click(screen.getByRole('button', { name: /changer de clan/i }));

      expect(screen.getByLabelText(/tag ou nom du clan/i)).toBeInTheDocument();
    });
  });

  describe('memoire des clans recents (retour utilisateur du 2026-08-04, limite 10)', () => {
    it('n affiche aucune liste tant qu aucun clan n a ete inspecte', () => {
      render(<ClanSearchForm />);

      expect(screen.queryByText(/clans récents/i)).not.toBeInTheDocument();
    });

    it('memorise le clan charge et propose un raccourci au prochain rendu', async () => {
      const first = render(<ClanSearchForm />);
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#20PP');
      await user.click(screen.getByRole('button', { name: /inspecter/i }));
      expect(replaceMock).toHaveBeenCalledWith('/dashboard?clan=%2320PP');
      first.unmount();

      render(<ClanSearchForm />);

      expect(await screen.findByTestId('recent-clan')).toHaveTextContent('#20PP');
    });

    it('charge directement le clan recent au clic', async () => {
      const first = render(<ClanSearchForm />);
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#20PP');
      await user.click(screen.getByRole('button', { name: /inspecter/i }));
      replaceMock.mockClear();
      first.unmount();

      render(<ClanSearchForm />);
      const recent = await screen.findByTestId('recent-clan');
      await user.click(recent);

      expect(replaceMock).toHaveBeenCalledWith('/dashboard?clan=%2320PP');
    });
  });
});
