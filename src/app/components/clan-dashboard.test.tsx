/**
 * Tests d'integration du dashboard membres (US 3.1 / US 3.2).
 * Le reseau est entierement mocke par MSW : le composant appelle le proxy
 * /api/clans/{tag} comme en production.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { setMockResponse } from '@/mocks/handlers';
import { FIXTURE_EMPTY_CLAN, FIXTURE_FULL_CLAN } from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { ClanDashboard } from './clan-dashboard';

async function submitTag(tag: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/tag du clan/i), tag);
  await user.click(screen.getByRole('button', { name: /inspecter/i }));
  return user;
}

describe('ClanDashboard', () => {
  it('invite a saisir un tag au premier affichage', () => {
    render(<ClanDashboard />);
    expect(screen.getByText(/saisissez le tag de votre clan/i)).toBeInTheDocument();
  });

  it('desactive le bouton et explique quand le tag est invalide', async () => {
    render(<ClanDashboard />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag du clan/i), '#2PZ');

    expect(screen.getByRole('button', { name: /inspecter/i })).toBeDisabled();
    expect(screen.getByText(/tag invalide/i)).toBeInTheDocument();
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
});
