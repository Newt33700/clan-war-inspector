/**
 * Tests de "La Meteo du Clan" (US 12, Consistency Trend).
 */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApiResource } from '@/hooks/use-api-resource';
import { WeatherSection } from './weather-section';

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };
const loading: ApiResource<unknown> = { status: 'loading', refetch: () => undefined };

function success(data: unknown): ApiResource<unknown> {
  return { status: 'success', data, refetch: () => undefined };
}

const CLAN = {
  tag: '#20PP',
  memberList: [
    { tag: '#ROC', name: 'Roc Alice', role: 'member' },
    { tag: '#DECRO', name: 'Decro Bob', role: 'member' },
  ],
};

function week(participants: { tag: string; battlesPlayed: number }[]) {
  return {
    seasonId: 1,
    sectionIndex: 1,
    standings: [
      {
        clan: {
          tag: '#20PP',
          participants: participants.map((p) => ({
            tag: p.tag,
            name: p.tag,
            decksUsed: p.battlesPlayed,
          })),
        },
      },
    ],
  };
}

const LOG = {
  items: [
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 4 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 8 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 15 },
      { tag: '#DECRO', battlesPlayed: 12 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 16 },
    ]),
    week([
      { tag: '#ROC', battlesPlayed: 16 },
      { tag: '#DECRO', battlesPlayed: 16 },
    ]),
  ],
};

describe('WeatherSection', () => {
  it('n affiche rien tant que rien n est soumis (idle)', () => {
    const { container } = render(
      <WeatherSection clanTag="#20PP" clanState={idle} logState={idle} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement', () => {
    render(<WeatherSection clanTag="#20PP" clanState={loading} logState={loading} />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('affiche un etat vide explicite quand personne n a un historique complet', () => {
    const shortLog = { items: [week([{ tag: '#ROC', battlesPlayed: 16 }])] };
    render(
      <WeatherSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(shortLog)}
      />,
    );
    expect(screen.getByText(/pas encore assez d historique/i)).toBeInTheDocument();
  });

  it('affiche une ligne par joueur a historique complet, triee Decrocheur avant Le Roc', () => {
    render(
      <WeatherSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );
    const rows = screen.getAllByTestId('weather-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('Decro Bob')).toBeInTheDocument();
    expect(within(rows[0]!).getByText(/decrocheur/i)).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Roc Alice')).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/^le roc$/i)).toBeInTheDocument();
  });

  it('dessine un sparkline colore selon la classification de chaque joueur', () => {
    render(
      <WeatherSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );
    const rows = screen.getAllByTestId('weather-row');
    const decroLine = within(rows[0]!).getByTestId('sparkline-line');
    const rocLine = within(rows[1]!).getByTestId('sparkline-line');
    expect(decroLine.getAttribute('class')).toContain('stroke-royale-red-500');
    expect(rocLine.getAttribute('class')).toContain('stroke-royale-green-500');
  });
});
