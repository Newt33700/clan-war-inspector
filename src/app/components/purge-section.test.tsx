/**
 * Tests de la vue de renvoi "A expulser" (regle produit du 2026-08-02) :
 * role Membre sous un seuil configurable de combats sur la semaine de
 * guerre en cours.
 */

import { fireEvent, render, screen, waitFor, within } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import type { ApiResource } from '@/hooks/use-api-resource';
import { setMockResponse } from '@/mocks/handlers';
import { FIXTURE_PLAYER_PROFILE } from '@/mocks/fixtures';
import { PurgeSection } from './purge-section';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    trophies: 5000,
    donations: 0,
    ...overrides,
  };
}

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };

function warSuccess(participants: unknown[]): ApiResource<unknown> {
  return {
    status: 'success',
    data: { state: 'war', periodType: 'warDay', clan: { participants } },
    refetch: () => undefined,
  };
}

const noop = () => undefined;

describe('PurgeSection', () => {
  it('affiche un resume texte de la regle active au dessus de la liste', () => {
    render(
      <PurgeSection
        members={[]}
        warState={warSuccess([])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    expect(screen.getByText(/règle active/i)).toHaveTextContent(
      'Règle active : rôle Membre et moins de 8 combats sur la semaine de guerre en cours.',
    );
  });

  it('le changement de seuil est repercute par le parent (etat controle)', () => {
    const onChange = vi.fn();
    render(
      <PurgeSection
        members={[]}
        warState={warSuccess([])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={onChange}
        ready
      />,
    );
    fireEvent.change(screen.getByLabelText(/seuil de combats sur la semaine en cours/i), {
      target: { value: '10' },
    });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('n affiche rien tant que les donnees ne sont pas pretes', () => {
    const { container } = render(
      <PurgeSection
        members={[]}
        warState={idle}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un message distinct quand le clan n est pas en guerre', () => {
    render(
      <PurgeSection
        members={[member({ tag: '#A' })]}
        warState={{
          status: 'success',
          data: { state: 'notInWar' },
          refetch: () => undefined,
        }}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    expect(screen.getByText(/n.est pas en guerre actuellement/i)).toBeInTheDocument();
  });

  it('n evalue pas les candidats un jour d entrainement (verifie sur le clan reel #20J20QG)', () => {
    // Un jour d'entrainement, `decksUsed` vaut 0 pour tout le clan (la
    // semaine de guerre n'a pas encore commence) : evaluer la regle sur
    // cette donnee produirait une alerte massive et trompeuse.
    const candidate = member({ tag: '#A', name: 'Alice', role: 'member' });
    render(
      <PurgeSection
        members={[candidate]}
        warState={{
          status: 'success',
          data: {
            state: 'full',
            periodType: 'training',
            clan: { participants: [{ tag: '#A', decksUsed: 0 }] },
          },
          refetch: () => undefined,
        }}
        minWeeklyBattles={4}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    expect(screen.queryByTestId('purge-row')).not.toBeInTheDocument();
    expect(screen.getByText(/jour d.entraînement/i)).toBeInTheDocument();
  });

  it('liste un membre sous le seuil, mais pas un role elder', () => {
    const candidate = member({ tag: '#A', name: 'Alice', role: 'member' });
    const elder = member({ tag: '#B', name: 'Bob', role: 'elder' });
    render(
      <PurgeSection
        members={[candidate, elder]}
        warState={warSuccess([
          { tag: '#A', decksUsed: 2 },
          { tag: '#B', decksUsed: 2 },
        ])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    const rows = screen.getAllByTestId('purge-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Alice');
  });

  it('affiche un etat vide explicite si personne n est sous le seuil', () => {
    const candidate = member({ tag: '#A', name: 'Alice' });
    render(
      <PurgeSection
        members={[candidate]}
        warState={warSuccess([{ tag: '#A', decksUsed: 16 }])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    expect(screen.getByText(/aucun membre problématique/i)).toBeInTheDocument();
  });

  it('affiche une erreur si la copie echoue', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    const candidate = member({ tag: '#A', name: 'Alice' });
    render(
      <PurgeSection
        members={[candidate]}
        warState={warSuccess([{ tag: '#A', decksUsed: 2 }])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /copier la liste/i }));

    expect(await screen.findByText(/impossible de copier/i)).toBeInTheDocument();
    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });

  it('desactive le bouton de copie quand la liste est vide, plutot que de le masquer (US 12.3)', () => {
    const candidate = member({ tag: '#A', name: 'Alice' });
    render(
      <PurgeSection
        members={[candidate]}
        warState={warSuccess([{ tag: '#A', decksUsed: 16 }])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    const button = screen.getByRole('button', { name: /copier la liste/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('copie un message de moderation unique avec le seuil actif et confirme "Copié ! ✅" (US 12.3)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const alice = member({ tag: '#A', name: 'Alice' });
    const bob = member({ tag: '#B', name: 'Bob' });
    render(
      <PurgeSection
        members={[alice, bob]}
        warState={warSuccess([
          { tag: '#A', decksUsed: 2 },
          { tag: '#B', decksUsed: 3 },
        ])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );

    const button = screen.getByRole('button', { name: /copier la liste/i });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "⚠️ Mise au point du Clan : Les joueurs suivants n'ont pas respecté le " +
          'quota de combats cette semaine sur 8 : Alice, Bob. ' +
          'Merci de corriger le tir rapidement !',
      ),
    );
    expect(await screen.findByText('Copié ! ✅')).toBeInTheDocument();
  });

  it('ouvre la fiche joueur au clic sur le code du joueur', async () => {
    setMockResponse('playerProfile', { ...FIXTURE_PLAYER_PROFILE, tag: '#A' });
    const candidate = member({ tag: '#A', name: 'Alice', role: 'member' });
    render(
      <PurgeSection
        members={[candidate]}
        warState={warSuccess([{ tag: '#A', decksUsed: 2 }])}
        minWeeklyBattles={8}
        onMinWeeklyBattlesChange={noop}
        ready
      />,
    );
    const user = userEvent.setup();

    const row = screen.getByTestId('purge-row');
    await user.click(within(row).getByRole('button', { name: '#A' }));

    const drawer = screen
      .getByRole('heading', { name: /profil joueur/i })
      .closest('aside')!;
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await within(drawer).findByText('500');
  });
});
