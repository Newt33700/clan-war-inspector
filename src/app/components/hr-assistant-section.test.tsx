import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

const idleWarState: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };

describe('HrAssistantSection', () => {
  it('affiche un squelette tant que ready est faux', () => {
    render(
      <HrAssistantSection
        members={[]}
        attendance={[]}
        warState={idleWarState}
        ready={false}
      />,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByText(/meritant/i)).not.toBeInTheDocument();
  });

  it('affiche un etat vide illustre quand personne ne qualifie', () => {
    render(
      <HrAssistantSection members={[]} attendance={[]} warState={idleWarState} ready />,
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
        warState={idleWarState}
        ready
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
        warState={{
          status: 'success',
          data: { clan: { participants: [] } },
          refetch: () => undefined,
        }}
        ready
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
        warState={{
          status: 'success',
          data: { clan: { participants: [{ tag: '#C', decksUsed: 4 }] } },
          refetch: () => undefined,
        }}
        ready
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
        warState={idleWarState}
        ready
      />,
    );
    expect(screen.queryByTestId('watch-card')).not.toBeInTheDocument();
  });
});
