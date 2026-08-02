/**
 * Tests d'integration du dashboard membres (US 3.1 / US 3.2).
 * Le reseau est entierement mocke par MSW : le composant appelle le proxy
 * /api/clans/{tag} comme en production.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { setMockResponse } from '@/mocks/handlers';
import {
  FIXTURE_EMPTY_CLAN,
  FIXTURE_FULL_CLAN,
  FIXTURE_RIVER_RACE_IDLE,
  FIXTURE_RIVER_RACE_LOG,
} from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { ClanDashboard } from './clan-dashboard';

async function submitTag(tag: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/tag du clan/i), tag);
  await user.click(screen.getByRole('button', { name: /inspecter/i }));
  return user;
}

describe('ClanDashboard', () => {
  // La soumission (US 6.2) ecrit le tag dans l'URL : on repart d'une URL
  // propre a chaque test pour ne pas contaminer le mount suivant.
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
  });

  it('invite a saisir un tag au premier affichage', () => {
    render(<ClanDashboard />);
    expect(screen.getByText(/saisissez le tag de votre clan/i)).toBeInTheDocument();
  });

  it('desactive le bouton immediatement quand le tag est invalide', async () => {
    render(<ClanDashboard />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag du clan/i), '#2PZ');

    expect(screen.getByRole('button', { name: /inspecter/i })).toBeDisabled();
  });

  it('n affiche le message de format invalide qu apres une pause de frappe (US 6.5)', async () => {
    render(<ClanDashboard />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag du clan/i), '#2PZ');

    // Pas encore affiche juste apres la frappe.
    expect(screen.queryByText(/tag invalide/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/tag invalide/i)).toBeInTheDocument();
    });
  });

  it('affiche un exemple de tag realiste et une aide pour le retrouver', () => {
    render(<ClanDashboard />);

    expect(screen.getByLabelText(/tag du clan/i)).toHaveAttribute(
      'placeholder',
      '#20J20QG',
    );
    expect(screen.getByText(/visible dans clash royale/i)).toBeInTheDocument();
  });

  it('charge puis affiche les membres du clan via le proxy mocke', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    const rows = await screen.findAllByTestId('member-row');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('Joueur 1')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Chef')).toBeInTheDocument();
  });

  it('affiche l en-tete d identite du clan une fois charge (US 6.1)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');
    await screen.findAllByTestId('member-row');

    const header = screen.getByTestId('clan-header');
    expect(within(header).getByText('Test Clan')).toBeInTheDocument();
    expect(within(header).getByText(/3\/50 membres/)).toBeInTheDocument();
    expect(document.title).toBe('Test Clan | Clan War Inspector');
  });

  it('n affiche pas l en-tete de clan avant chargement reussi', () => {
    render(<ClanDashboard />);
    expect(screen.queryByTestId('clan-header')).not.toBeInTheDocument();
  });

  it('met a jour l URL au clic sur Inspecter, sans recharger la page (US 6.2)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    expect(window.location.search).toBe('?clan=%2320PP');
  });

  it('charge automatiquement le tag present dans l URL au demarrage (US 6.2)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    window.history.replaceState(null, '', '/?clan=%2320PP');

    render(<ClanDashboard />);

    const rows = await screen.findAllByTestId('member-row');
    expect(rows).toHaveLength(3);
    expect(screen.getByLabelText(/tag du clan/i)).toHaveValue('#20PP');
  });

  it('priorise le tag de l URL sur celui memorise en localStorage (US 6.2)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    window.localStorage.setItem('clan-war-inspector:last-clan-tag', '#RRRR');
    window.history.replaceState(null, '', '/?clan=%2320PP');

    render(<ClanDashboard />);

    await screen.findAllByTestId('member-row');
    expect(screen.getByLabelText(/tag du clan/i)).toHaveValue('#20PP');
  });

  it('trie par role descendant par defaut (chef en premier)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    const rows = await screen.findAllByTestId('member-row');
    const roles = rows.map((row) => within(row).getAllByRole('cell')[1]?.textContent);
    expect(roles).toEqual(['Chef', 'Aine', 'Membre']);
  });

  it('change de colonne de tri au clic et affiche l indicateur', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);
    const user = await submitTag('#20PP');
    await screen.findAllByTestId('member-row');

    await user.click(screen.getByRole('button', { name: /trophees/i }));

    const rows = screen.getAllByTestId('member-row');
    const trophies = rows.map((row) => within(row).getAllByRole('cell')[3]?.textContent);
    expect(trophies).toEqual(['5000', '6500', '7000']);
    expect(screen.getByRole('columnheader', { name: /trophees/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('inverse la direction en recliquant la meme colonne', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);
    const user = await submitTag('#20PP');
    await screen.findAllByTestId('member-row');

    await user.click(screen.getByRole('button', { name: /trophees/i }));
    await user.click(screen.getByRole('button', { name: /trophees/i }));

    const rows = screen.getAllByTestId('member-row');
    const trophies = rows.map((row) => within(row).getAllByRole('cell')[3]?.textContent);
    expect(trophies).toEqual(['7000', '6500', '5000']);
    expect(screen.getByRole('columnheader', { name: /trophees/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('affiche l etat clan vide', async () => {
    setMockResponse('clan', FIXTURE_EMPTY_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    expect(
      await screen.findByText(/ce clan ne compte aucun membre/i),
    ).toBeInTheDocument();
  });

  it('affiche le message d erreur stable du proxy', async () => {
    mockServer.use(
      http.get('*/api/clans/:clanTag', () =>
        HttpResponse.json(
          {
            error: {
              code: 'CLAN_NOT_FOUND',
              message: 'Aucun clan ne correspond a ce tag.',
            },
          },
          { status: 404 },
        ),
      ),
    );
    render(<ClanDashboard />);

    await submitTag('#20PP');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Aucun clan ne correspond a ce tag.');
  });

  it('passe par un etat de chargement visible', async () => {
    // Reponse controlee manuellement plutot qu'un delai fixe : evite une
    // course avec l'horloge reelle si l'environnement de test est lent.
    let resolveClanResponse!: (response: Response) => void;
    mockServer.use(
      http.get(
        '*/api/clans/:clanTag',
        () => new Promise<Response>((resolve) => (resolveClanResponse = resolve)),
      ),
    );
    render(<ClanDashboard />);

    await submitTag('#20PP');

    expect(screen.getByRole('status')).toHaveTextContent(/chargement/i);

    resolveClanResponse(HttpResponse.json(FIXTURE_FULL_CLAN));
    await waitFor(() => {
      expect(screen.getAllByTestId('member-row')).toHaveLength(3);
    });
  });

  describe('US 6.4 : horodatage et rafraichissement de la guerre en cours', () => {
    it('affiche l heure de derniere mise a jour et permet un rafraichissement cible', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IDLE);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      await screen.findAllByTestId('member-row');

      const warSection = screen
        .getByRole('heading', { name: /guerre en cours/i })
        .closest('section')!;
      await waitFor(() => {
        expect(
          within(warSection).getByText(/mise a jour a \d{2}:\d{2}/i),
        ).toBeInTheDocument();
      });

      // Le tri des membres et le tag saisi ne doivent pas etre affectes.
      await user.click(screen.getByRole('button', { name: /trophees/i }));
      const beforeRows = screen
        .getAllByTestId('member-row')
        .map((row) => within(row).getAllByRole('cell')[0]?.textContent);

      await user.click(within(warSection).getByRole('button', { name: /actualiser/i }));

      await waitFor(() => {
        expect(
          within(warSection).getByText(/mise a jour a \d{2}:\d{2}/i),
        ).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/tag du clan/i)).toHaveValue('#20PP');
      const afterRows = screen
        .getAllByTestId('member-row')
        .map((row) => within(row).getAllByRole('cell')[0]?.textContent);
      expect(afterRows).toEqual(beforeRows);
    });
  });

  describe('US 6.3 : reprise apres erreur, section par section', () => {
    it('reessaie uniquement le clan sans re-soumettre le formulaire', async () => {
      // Pas de mock configure : le handler global repond 404.
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      const alertsBefore = await screen.findAllByRole('alert');
      expect(alertsBefore).toHaveLength(1);

      setMockResponse('clan', FIXTURE_FULL_CLAN);
      await user.click(screen.getByRole('button', { name: /reessayer/i }));

      const rows = await screen.findAllByTestId('member-row');
      expect(rows).toHaveLength(3);
    });

    it('reessaie la guerre en cours sans recharger membres ni historique', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      // currentRiverRace et riverRaceLog restent non configures (404).
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      await screen.findAllByTestId('member-row');
      const warSection = screen
        .getByRole('heading', { name: /guerre en cours/i })
        .closest('section')!;
      await waitFor(() => {
        expect(within(warSection).getByRole('alert')).toBeInTheDocument();
      });

      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IDLE);
      await user.click(within(warSection).getByRole('button', { name: /reessayer/i }));

      await waitFor(() => {
        expect(
          within(warSection).getByText(/n est pas en guerre actuellement/i),
        ).toBeInTheDocument();
      });
      // L'historique, toujours en erreur, n'a pas ete affecte par ce reessai.
      const historySection = screen
        .getByRole('heading', { name: /historique des guerres/i })
        .closest('section')!;
      expect(within(historySection).getByRole('alert')).toBeInTheDocument();
    });

    it('reessaie l historique sans recharger la guerre en cours', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      await screen.findAllByTestId('member-row');
      const historySection = screen
        .getByRole('heading', { name: /historique des guerres/i })
        .closest('section')!;
      await waitFor(() => {
        expect(within(historySection).getByRole('alert')).toBeInTheDocument();
      });

      setMockResponse('riverRaceLog', FIXTURE_RIVER_RACE_LOG);
      await user.click(
        within(historySection).getByRole('button', { name: /reessayer/i }),
      );

      await waitFor(() => {
        expect(
          within(historySection).getAllByTestId('history-row').length,
        ).toBeGreaterThan(0);
      });
    });
  });
});
