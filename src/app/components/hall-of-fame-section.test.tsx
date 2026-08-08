import { render, screen } from '@/test-utils';
import { describe, expect, it } from 'vitest';
import {
  FIXTURE_RIVER_RACE_IN_PROGRESS,
  FIXTURE_RIVER_RACE_IDLE,
} from '@/mocks/fixtures';
import { HallOfFameSection } from './hall-of-fame-section';

describe('HallOfFameSection', () => {
  it('n affiche rien tant que idle', () => {
    const { container } = render(
      <HallOfFameSection warState={{ status: 'idle', refetch: () => undefined }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('n affiche rien en erreur (deja signalee par la guerre en cours)', () => {
    const { container } = render(
      <HallOfFameSection
        warState={{ status: 'error', message: 'oops', refetch: () => undefined }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement', () => {
    render(
      <HallOfFameSection warState={{ status: 'loading', refetch: () => undefined }} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('affiche le podium top 3 tries par rang, base sur la guerre en cours', () => {
    render(
      <HallOfFameSection
        warState={{
          status: 'success',
          data: FIXTURE_RIVER_RACE_IN_PROGRESS,
          refetch: () => undefined,
        }}
      />,
    );
    const cards = screen.getAllByTestId('podium-card');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.getAttribute('data-rank'))).toEqual(['1', '2', '3']);
    expect(screen.getByText('Joueur 1')).toBeInTheDocument();
    expect(screen.getByText('3200 fame')).toBeInTheDocument();
  });

  it('affiche un etat vide illustre quand le clan n est pas en guerre', () => {
    render(
      <HallOfFameSection
        warState={{
          status: 'success',
          data: FIXTURE_RIVER_RACE_IDLE,
          refetch: () => undefined,
        }}
      />,
    );
    expect(screen.getByText(/pas encore de classement/i)).toBeInTheDocument();
  });
});
