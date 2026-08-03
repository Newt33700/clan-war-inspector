/**
 * Tests d'orchestration de DashboardView (US 13.6, Epique 13) : tri,
 * recherche de membre et ouverture du panneau joueur, avec des donnees
 * deja "resolues" (seed), comme le ferait le Server Component parent.
 * Le detail de chaque section (tableau, jauges...) est deja couvert par
 * les tests de `MembersTable`, `CurrentWarSection`, etc.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setMockResponse } from '@/mocks/handlers';
import {
  FIXTURE_EMPTY_CLAN,
  FIXTURE_FULL_CLAN,
  FIXTURE_PLAYER_PROFILE,
} from '@/mocks/fixtures';
import type { ServerResourceResult } from '@/lib/server-clan-resource';
import { DashboardView } from './dashboard-view';

function success<T>(data: T): ServerResourceResult<T> {
  return { status: 'success', data };
}

describe('DashboardView', () => {
  it('trie par role descendant par defaut (chef en premier)', () => {
    render(<DashboardView tag="#20PP" clanSeed={success(FIXTURE_FULL_CLAN)} />);

    const rows = screen.getAllByTestId('member-row');
    const roles = rows.map((row) => within(row).getAllByRole('cell')[1]?.textContent);
    expect(roles).toEqual(['Chef', 'Aine', 'Membre']);
  });

  it('change de colonne de tri au clic et inverse en recliquant', async () => {
    render(<DashboardView tag="#20PP" clanSeed={success(FIXTURE_FULL_CLAN)} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /trophees/i }));
    let rows = screen.getAllByTestId('member-row');
    expect(rows.map((row) => within(row).getAllByRole('cell')[3]?.textContent)).toEqual([
      '5000',
      '6500',
      '7000',
    ]);

    await user.click(screen.getByRole('button', { name: /trophees/i }));
    rows = screen.getAllByTestId('member-row');
    expect(rows.map((row) => within(row).getAllByRole('cell')[3]?.textContent)).toEqual([
      '7000',
      '6500',
      '5000',
    ]);
  });

  it('filtre les membres par pseudo en temps reel', async () => {
    render(<DashboardView tag="#20PP" clanSeed={success(FIXTURE_FULL_CLAN)} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/rechercher un membre/i), 'joueur 2');

    const rows = screen.getAllByTestId('member-row');
    expect(rows).toHaveLength(1);
    expect(within(rows[0]!).getByText('Joueur 2')).toBeInTheDocument();
  });

  it('affiche un message distinct quand aucun membre ne correspond a la recherche', async () => {
    render(<DashboardView tag="#20PP" clanSeed={success(FIXTURE_FULL_CLAN)} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/rechercher un membre/i), 'zzzzz');

    expect(await screen.findByText(/aucun membre ne correspond/i)).toBeInTheDocument();
    expect(screen.queryByTestId('member-row')).not.toBeInTheDocument();
  });

  it('ouvre le panneau joueur au clic sur une ligne, et le ferme', async () => {
    setMockResponse('playerProfile', FIXTURE_PLAYER_PROFILE);
    render(<DashboardView tag="#20PP" clanSeed={success(FIXTURE_FULL_CLAN)} />);
    const user = userEvent.setup();

    const rows = screen.getAllByTestId('member-row');
    await user.click(within(rows[0]!).getByRole('button', { name: /joueur 1/i }));

    const drawer = screen
      .getByRole('heading', { name: /profil joueur/i })
      .closest('aside')!;
    await within(drawer).findByText('500');

    await user.click(within(drawer).getByRole('button', { name: /fermer/i }));
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  it('affiche l etat clan vide', () => {
    render(<DashboardView tag="#20PP" clanSeed={success(FIXTURE_EMPTY_CLAN)} />);

    expect(screen.getByText(/ce clan ne compte aucun membre/i)).toBeInTheDocument();
  });
});
