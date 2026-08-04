import { fireEvent, render, screen, waitFor, within } from '@/test-utils';
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

const MIN_WEEKLY_BATTLES = 8;

describe('HrAssistantSection', () => {
  it('n affiche rien avant toute soumission de tag (idle)', () => {
    const { container } = render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        logState={idle}
        warState={idle}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
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
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
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
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    expect(screen.getByText(/aucun méritant pour l.instant/i)).toBeInTheDocument();
    expect(screen.getByText(/personne sur la sellette/i)).toBeInTheDocument();
  });

  it('affiche une carte meritant avec le badge de promotion visible, le tag deplie au tap', () => {
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
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    const card = screen.getByTestId('merit-card');
    expect(within(card).getByText('Alice')).toBeInTheDocument();
    expect(within(card).getByText(/promotion suggérée/i)).toBeInTheDocument();
    expect(within(card).queryByText('#A')).not.toBeInTheDocument();

    fireEvent.click(within(card).getByRole('button'));

    expect(within(card).getByText('#A')).toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: /copier le tag/i }),
    ).toBeInTheDocument();
  });

  it('affiche une carte sur la sellette avec le decompte de la semaine en cours', () => {
    const candidate = member({ tag: '#B', name: 'Bob', role: 'elder' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[]}
        logState={success}
        warState={{
          status: 'success',
          data: { clan: { participants: [{ tag: '#B', decksUsed: 3 }] } },
          refetch: () => undefined,
        }}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    const card = screen.getByTestId('watch-card');
    expect(within(card).getByText('Bob')).toBeInTheDocument();
    expect(within(card).getByText(/rétrogradation conseillée/i)).toBeInTheDocument();
    expect(within(card).getByText(/3\/16 combats cette semaine/i)).toBeInTheDocument();
  });

  it('utilise une bordure gauche rouge epaisse, distincte du vert des meritants (US 12.2)', () => {
    const candidate = member({ tag: '#B', name: 'Bob', role: 'elder' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[]}
        logState={success}
        warState={{
          status: 'success',
          data: { clan: { participants: [{ tag: '#B', decksUsed: 3 }] } },
          refetch: () => undefined,
        }}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    const card = screen.getByTestId('watch-card');
    expect(card.className).toContain('border-l-4');
    expect(card.className).toContain('border-l-cr-red');
    expect(card.className).not.toContain('border-l-cr-green');
  });

  it('exclut un role coLeader (seuls les elder sont evalues)', () => {
    const candidate = member({ tag: '#C', name: 'Carol', role: 'coLeader' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[]}
        logState={success}
        warState={{
          status: 'success',
          data: { clan: { participants: [{ tag: '#C', decksUsed: 0 }] } },
          refetch: () => undefined,
        }}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    expect(screen.queryByTestId('watch-card')).not.toBeInTheDocument();
  });

  it('n evalue pas Sur la sellette un jour d entrainement (verifie sur le clan reel #20J20QG)', () => {
    // Un jour d'entrainement, `decksUsed` vaut 0 pour tout le clan (la
    // semaine de guerre n'a pas encore commence) : sans ce garde, tout
    // aine se retrouve marque "a retrograder" alors que rien n a ete joue.
    const candidate = member({ tag: '#B', name: 'Bob', role: 'elder' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[]}
        logState={success}
        warState={{
          status: 'success',
          data: {
            periodType: 'training',
            clan: { participants: [{ tag: '#B', decksUsed: 0 }] },
          },
          refetch: () => undefined,
        }}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    expect(screen.queryByTestId('watch-card')).not.toBeInTheDocument();
    expect(screen.getByText(/jour d.entraînement/i)).toBeInTheDocument();
  });

  it('n evalue pas la semaine en cours tant que la guerre n est pas chargee', () => {
    const candidate = member({ tag: '#D', name: 'Dave', role: 'elder' });
    render(
      <HrAssistantSection
        members={[candidate]}
        attendance={[attendance('#D', [16])]}
        logState={success}
        warState={idle}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    expect(screen.queryByTestId('watch-card')).not.toBeInTheDocument();
  });

  it('n affiche rien en erreur (deja signalee par les sections membres/historique)', () => {
    const { container } = render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        logState={idle}
        warState={idle}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
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
        attendance={[attendance('#A', [16, 16, 16])]}
        logState={success}
        warState={{
          status: 'success',
          data: { clan: { participants: [{ tag: '#B', decksUsed: 3 }] } },
          refetch: () => undefined,
        }}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );

    const buttons = screen.getAllByRole('button', {
      name: /copier les recommandations/i,
    });
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[0]!);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('Alice (#A) - Promotion suggeree : Aine'),
    );

    fireEvent.click(buttons[1]!);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('Bob (#B) - 3 combats cette semaine'),
    );
  });

  it('n affiche pas de bouton de copie globale quand les listes sont vides', () => {
    render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        logState={success}
        warState={idle}
        minWeeklyBattles={MIN_WEEKLY_BATTLES}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /copier les recommandations/i }),
    ).not.toBeInTheDocument();
  });
});
