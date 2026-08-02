import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FIXTURE_RIVER_RACE_LOG } from '@/mocks/fixtures';
import { HallOfFameSection } from './hall-of-fame-section';

describe('HallOfFameSection', () => {
  it('n affiche rien tant que idle', () => {
    const { container } = render(
      <HallOfFameSection
        logState={{ status: 'idle', refetch: () => undefined }}
        clanTag="#20PP"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('n affiche rien en erreur (deja signalee par l historique)', () => {
    const { container } = render(
      <HallOfFameSection
        logState={{ status: 'error', message: 'oops', refetch: () => undefined }}
        clanTag="#20PP"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement', () => {
    render(
      <HallOfFameSection
        logState={{ status: 'loading', refetch: () => undefined }}
        clanTag="#20PP"
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('affiche le podium top 3 tries par rang', () => {
    render(
      <HallOfFameSection
        logState={{
          status: 'success',
          data: FIXTURE_RIVER_RACE_LOG,
          refetch: () => undefined,
        }}
        clanTag="#20PP"
      />,
    );
    const cards = screen.getAllByTestId('podium-card');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.getAttribute('data-rank'))).toEqual(['1', '2', '3']);
    expect(screen.getByText('Joueur 1')).toBeInTheDocument();
    expect(screen.getByText('3200 fame')).toBeInTheDocument();
  });

  it('affiche un etat vide illustre si aucune semaine complete n est disponible', () => {
    render(
      <HallOfFameSection
        logState={{ status: 'success', data: { items: [] }, refetch: () => undefined }}
        clanTag="#20PP"
      />,
    );
    expect(screen.getByText(/pas encore de classement/i)).toBeInTheDocument();
  });
});
