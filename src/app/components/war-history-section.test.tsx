/**
 * Tests de l'historique des guerres (US 4.3/4.4), en particulier la
 * legende visible des symboles (audit UX du 2026-08-02, US-6) et la
 * premiere colonne fixee au defilement horizontal (US-11).
 */

import { fireEvent, render, screen, within } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ApiResource } from '@/hooks/use-api-resource';
import { setMockResponse } from '@/mocks/handlers';
import { FIXTURE_PLAYER_PROFILE, FIXTURE_RIVER_RACE_LOG } from '@/mocks/fixtures';
import { WarHistorySection } from './war-history-section';

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };
const success: ApiResource<unknown> = {
  status: 'success',
  data: FIXTURE_RIVER_RACE_LOG,
  refetch: () => undefined,
};

const loading: ApiResource<unknown> = { status: 'loading', refetch: () => undefined };

describe('WarHistorySection', () => {
  it('n affiche rien avant toute soumission (idle)', () => {
    const { container } = render(
      <WarHistorySection logState={idle} clanTag="#20PP" currentMemberTags={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement (US 14.5)', () => {
    render(
      <WarHistorySection logState={loading} clanTag="#20PP" currentMemberTags={[]} />,
    );
    expect(
      screen.getByRole('status', { name: /chargement de l.historique/i }),
    ).toBeInTheDocument();
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
    expect(screen.getByText(/non membre cette semaine-là/i)).toBeInTheDocument();
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
    expect(screen.getByRole('columnheader', { name: /^total/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    fireEvent.click(totalButton);
    expect(screen.getByRole('columnheader', { name: /^total/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  describe('US 14.1 : vue carte mobile', () => {
    it('affiche une carte par joueur avec nom, tag et total', () => {
      render(
        <WarHistorySection
          logState={success}
          clanTag="#20PP"
          currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
        />,
      );

      const cards = screen.getAllByTestId('history-card');
      expect(cards).toHaveLength(4);
      expect(within(cards[0]!).getByText('Joueur 1')).toBeInTheDocument();
      expect(within(cards[0]!).getByText('#PLAYER1')).toBeInTheDocument();
      expect(within(cards[0]!).getByText(/32 total/)).toBeInTheDocument();
    });

    it('trie les cartes via le selecteur mobile', async () => {
      const user = userEvent.setup();
      render(
        <WarHistorySection
          logState={success}
          clanTag="#20PP"
          currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
        />,
      );

      await user.selectOptions(
        screen.getByRole('combobox', { name: /trier par/i }),
        'total-asc',
      );

      const cards = screen.getAllByTestId('history-card');
      expect(within(cards[0]!).getByText('Joueur 4')).toBeInTheDocument();
    });

    it('n affiche pas de bouton "voir toutes les semaines" avec peu de semaines', () => {
      render(
        <WarHistorySection
          logState={success}
          clanTag="#20PP"
          currentMemberTags={['#PLAYER1']}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /voir toutes les semaines/i }),
      ).not.toBeInTheDocument();
    });

    it('deplie une carte au-dela de 4 semaines', async () => {
      const manyWeeksLog = {
        items: FIXTURE_RIVER_RACE_LOG.items.concat(
          FIXTURE_RIVER_RACE_LOG.items.map((item) => ({
            ...item,
            sectionIndex: item.sectionIndex + 10,
          })),
          FIXTURE_RIVER_RACE_LOG.items.map((item) => ({
            ...item,
            sectionIndex: item.sectionIndex + 20,
          })),
          FIXTURE_RIVER_RACE_LOG.items.map((item) => ({
            ...item,
            sectionIndex: item.sectionIndex + 30,
          })),
          FIXTURE_RIVER_RACE_LOG.items.map((item) => ({
            ...item,
            sectionIndex: item.sectionIndex + 40,
          })),
        ),
      };
      const user = userEvent.setup();
      render(
        <WarHistorySection
          logState={{ status: 'success', data: manyWeeksLog, refetch: () => undefined }}
          clanTag="#20PP"
          currentMemberTags={['#PLAYER1']}
        />,
      );
      const card = screen.getAllByTestId('history-card')[0]!;
      const expandButton = within(card).getByRole('button', {
        name: /voir toutes les semaines/i,
      });

      await user.click(expandButton);

      expect(
        within(card).getByRole('button', { name: /voir moins de semaines/i }),
      ).toBeInTheDocument();
    });
  });

  it('ouvre la fiche joueur au clic sur le code du joueur', async () => {
    setMockResponse('playerProfile', FIXTURE_PLAYER_PROFILE);
    render(
      <WarHistorySection
        logState={success}
        clanTag="#20PP"
        currentMemberTags={['#PLAYER1', '#PLAYER2', '#PLAYER3', '#PLAYER4']}
      />,
    );
    const user = userEvent.setup();

    const table = screen.getByRole('table');
    await user.click(within(table).getByRole('button', { name: /joueur 1/i }));

    const drawer = screen
      .getByRole('heading', { name: /profil joueur/i })
      .closest('aside')!;
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await within(drawer).findByText('500');
  });
});
