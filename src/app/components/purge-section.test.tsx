/**
 * Tests de la vue de renvoi "A expulser" (regle produit du 2026-08-02) :
 * role Membre sous un seuil configurable de combats sur la semaine de
 * guerre en cours.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import type { ApiResource } from '@/hooks/use-api-resource';
import { PurgeSection } from './purge-section';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    expLevel: 10,
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
    expect(screen.getByText(/regle active/i)).toHaveTextContent(
      'Regle active : role Membre et moins de 8 combats sur la semaine de guerre en cours.',
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
    expect(screen.getByText(/n est pas en guerre actuellement/i)).toBeInTheDocument();
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
    expect(screen.getByText(/aucun membre problematique/i)).toBeInTheDocument();
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
});
