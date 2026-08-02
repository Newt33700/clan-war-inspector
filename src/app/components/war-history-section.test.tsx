/**
 * Tests de l'historique des guerres (US 4.3/4.4), en particulier la
 * legende visible des symboles (audit UX du 2026-08-02, US-6) et la
 * premiere colonne fixee au defilement horizontal (US-11).
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApiResource } from '@/hooks/use-api-resource';
import { FIXTURE_RIVER_RACE_LOG } from '@/mocks/fixtures';
import { WarHistorySection } from './war-history-section';

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };
const success: ApiResource<unknown> = {
  status: 'success',
  data: FIXTURE_RIVER_RACE_LOG,
  refetch: () => undefined,
};

describe('WarHistorySection', () => {
  it('n affiche rien avant toute soumission (idle)', () => {
    const { container } = render(
      <WarHistorySection logState={idle} clanTag="#20PP" currentMemberTags={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche une legende visible des symboles complet/incomplet/critique', () => {
    render(
      <WarHistorySection
        logState={success}
        clanTag="#20PP"
        currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
      />,
    );
    expect(screen.getByText('Complet')).toBeInTheDocument();
    expect(screen.getByText('Incomplet')).toBeInTheDocument();
    expect(screen.getByText('Critique')).toBeInTheDocument();
    expect(screen.getByText(/non membre cette semaine-la/i)).toBeInTheDocument();
  });

  it('fixe la colonne Joueur (en-tete et lignes) au defilement horizontal', () => {
    render(
      <WarHistorySection
        logState={success}
        clanTag="#20PP"
        currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
      />,
    );
    const headerCell = screen.getByRole('columnheader', { name: /joueur/i });
    expect(headerCell.className).toContain('sticky');
    const rowCell = screen.getAllByTestId('history-row')[0]?.querySelector('th');
    expect(rowCell?.className).toContain('sticky');
  });

  it('recalcule l ombre de scroll au defilement horizontal', () => {
    const { container } = render(
      <WarHistorySection
        logState={success}
        clanTag="#20PP"
        currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
      />,
    );
    const scrollContainer = container.querySelector('.overflow-x-auto')!;
    expect(() => fireEvent.scroll(scrollContainer)).not.toThrow();
  });

  it('inverse la direction de tri en recliquant la meme colonne', () => {
    render(
      <WarHistorySection
        logState={success}
        clanTag="#20PP"
        currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
      />,
    );
    const totalButton = screen.getByRole('button', { name: /^total/i });
    fireEvent.click(totalButton);
    expect(
      screen.getByRole('columnheader', { name: /^total/i }),
    ).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(totalButton);
    expect(
      screen.getByRole('columnheader', { name: /^total/i }),
    ).toHaveAttribute('aria-sort', 'descending');
  });
});
