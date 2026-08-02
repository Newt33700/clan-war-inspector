import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import type { ApiResource } from '@/hooks/use-api-resource';
import type { PlayerAttendance } from '@/domain/war/war-history';
import { HrAssistantSection } from './hr-assistant-section';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    expLevel: 10,
    trophies: 5000,
    donations: 1,
    ...overrides,
  };
}

function attendance(tag: string, battlesByWeek: (number | null)[]): PlayerAttendance {
  const present = battlesByWeek.filter((b): b is number => b !== null);
  return {
    tag,
    name: tag,
    battlesByWeek,
    totalBattles: present.reduce((sum, b) => sum + b, 0),
    weeksPresent: present.length,
    averagePerPresentWeek: 0,
  };
}

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };
const loading: ApiResource<unknown> = { status: 'loading', refetch: () => undefined };
const success: ApiResource<unknown> = {
  status: 'success',
  data: {},
  refetch: () => undefined,
};

describe('HrAssistantSection', () => {
  it('n affiche rien avant toute soumission de tag (idle)', () => {
    const { container } = render(
      <HrAssistantSection members={[]} attendance={[]} logState={idle} warState={idle} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement de l historique', () => {
    render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        logState={loading}
        warState={idle}
      />,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByText(/meritant/i)).not.toBeInTheDocument();
  });

  it('affiche un etat vide illustre quand personne ne qualifie', () => {
    render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        logState={success}
        warState={idle}
      />,
    );
    expect(screen.getByText(/aucun meritant pour l instant/i)).toBeInTheDocument();
    expect(screen.getByText(/personne sur la sellette/i)).toBeInTheDocument();
  });

  it('affiche une carte meritant avec le badge de promotion et le tag', () => {
    const candidate = member({
      tag: '#A',
      name: 'Alice',
      role: 'member',
      donations: 2,
    });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[attendance('#A', [16, 16, 16])]}
        logState={success}
        warState={idle}
      />,
    );
    const card = screen.getByTestId('merit-card');
    expect(within(card).getByText('Alice')).toBeInTheDocument();
    expect(within(card).getByText('#A')).toBeInTheDocument();
    expect(within(card).getByText(/promotion suggeree/i)).toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: /copier le tag/i }),
    ).toBeInTheDocument();
  });

  it('affiche une carte sur la sellette avec les motifs et l avertissement', () => {
    const candidate = member({ tag: '#B', name: 'Bob', role: 'elder' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[attendance('#B', [3])]}
        logState={success}
        warState={{
          status: 'success',
          data: { clan: { participants: [] } },
          refetch: () => undefined,
        }}
      />,
    );
    const card = screen.getByTestId('watch-card');
    expect(within(card).getByText('Bob')).toBeInTheDocument();
    expect(within(card).getByText(/retrogradation conseillee/i)).toBeInTheDocument();
    expect(
      within(card).getByText(/combats insuffisants la semaine derniere/i),
    ).toBeInTheDocument();
  });

  it('prend en compte la guerre en cours (currentriverrace) pour la semaine en cours', () => {
    const candidate = member({ tag: '#C', name: 'Carol', role: 'coLeader' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[]}
        logState={success}
        warState={{
          status: 'success',
          data: { clan: { participants: [{ tag: '#C', decksUsed: 4 }] } },
          refetch: () => undefined,
        }}
      />,
    );
    const card = screen.getByTestId('watch-card');
    expect(
      within(card).getByText(/combats insuffisants cette semaine/i),
    ).toBeInTheDocument();
  });

  it('n evalue pas la semaine en cours tant que la guerre n est pas chargee', () => {
    const candidate = member({ tag: '#D', name: 'Dave', role: 'elder' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[attendance('#D', [16])]}
        logState={success}
        warState={idle}
      />,
    );
    expect(screen.queryByTestId('watch-card')).not.toBeInTheDocument();
  });

  it('n affiche rien en erreur (deja signalee par les sections membres/historique)', () => {
    const { container } = render(
      <HrAssistantSection members={[]} attendance={[]} logState={idle} warState={idle} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('propose de copier l ensemble des recommandations quand des candidats existent (audit UX 2026-08-02, US-10)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const merit = member({ tag: '#A', name: 'Alice', role: 'member', donations: 2 });
    const watch = member({ tag: '#B', name: 'Bob', role: 'elder' });
    render(
      <HrAssistantSection
        members={[merit, watch]}
        attendance={[attendance('#A', [16, 16, 16]), attendance('#B', [3])]}
        logState={success}
        warState={idle}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /copier les recommandations/i });
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[0]!);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('Alice (#A) - Promotion suggeree : Aine'),
    );

    fireEvent.click(buttons[1]!);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        'Bob (#B) - Combats insuffisants la semaine derniere',
      ),
    );
  });

  it('n affiche pas de bouton de copie globale quand les listes sont vides', () => {
    render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        logState={success}
        warState={idle}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /copier les recommandations/i }),
    ).not.toBeInTheDocument();
  });
});
