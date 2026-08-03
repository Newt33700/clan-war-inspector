/**
 * Tests du "Sas de Quarantaine" (US 11) : detection des nouveaux membres
 * (croise clan actuel / riverracelog) et enrichissement de leur profil
 * via /players/{tag} (indice de fiabilite).
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { mockServer } from '@/mocks/server';
import type { ApiResource } from '@/hooks/use-api-resource';
import { QuarantineSection } from './quarantine-section';

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };
const loading: ApiResource<unknown> = { status: 'loading', refetch: () => undefined };

function success(data: unknown): ApiResource<unknown> {
  return { status: 'success', data, refetch: () => undefined };
}

const CLAN = {
  tag: '#20PP',
  memberList: [
    { tag: '#OLD1', name: 'Ancien 1', role: 'elder' },
    { tag: '#NEW1', name: 'Nouveau 1', role: 'member', trophies: 6000 },
    { tag: '#NEW2', name: 'Nouveau 2', role: 'member', trophies: 4500 },
  ],
};

const LOG = {
  items: [
    {
      seasonId: 1,
      sectionIndex: 3,
      standings: [
        {
          clan: { tag: '#20PP', participants: [{ tag: '#OLD1', name: 'Ancien 1' }] },
        },
      ],
    },
  ],
};

const RISKY_PROFILE = {
  tag: '#NEW1',
  battleCount: 5000,
  badges: [{ name: 'ClanWarWins', progress: 0 }],
};
const GOOD_PROFILE = {
  tag: '#NEW2',
  battleCount: 2000,
  badges: [{ name: 'ClanWarWins', progress: 80 }],
};

describe('QuarantineSection', () => {
  it('n affiche rien tant que rien n est soumis (idle)', () => {
    const { container } = render(
      <QuarantineSection clanTag="#20PP" clanState={idle} logState={idle} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement', () => {
    render(<QuarantineSection clanTag="#20PP" clanState={loading} logState={loading} />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('affiche un etat vide explicite quand personne n est nouveau', () => {
    const onlyOldClan = success({
      tag: '#20PP',
      memberList: [{ tag: '#OLD1', name: 'Ancien 1', role: 'elder' }],
    });
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={onlyOldClan}
        logState={success(LOG)}
      />,
    );
    expect(screen.getByText(/aucun nouveau membre/i)).toBeInTheDocument();
  });

  it('detecte les nouveaux membres et ignore les anciens', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => new Promise(() => undefined)),
    );
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );
    expect(screen.getByText('Nouveau 1')).toBeInTheDocument();
    expect(screen.getByText('Nouveau 2')).toBeInTheDocument();
    expect(screen.queryByText('Ancien 1')).not.toBeInTheDocument();
  });

  it('affiche un squelette de carte avec message d analyse pendant l enrichissement', () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => new Promise(() => undefined)),
    );
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );
    expect(
      screen.getAllByRole('status', { name: /analyse du profil en cours/i }).length,
    ).toBeGreaterThan(0);
  });

  it('feu rouge : badge "A risque" et bouton de kick pour un profil a 0 victoire GDC', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) =>
        HttpResponse.json(params.playerTag === '#NEW1' ? RISKY_PROFILE : GOOD_PROFILE),
      ),
    );
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );

    const card = (await screen.findByText('Nouveau 1')).closest(
      '[data-testid="quarantine-card"]',
    ) as HTMLElement;
    await waitFor(() => {
      expect(within(card).getByText(/a risque/i)).toBeInTheDocument();
    });
    expect(within(card).getByText('5000')).toBeInTheDocument();
    expect(within(card).getByText('0')).toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: /copier tag pour kick/i }),
    ).toBeInTheDocument();
  });

  it('feu vert : badge "Bon profil" sans bouton de kick', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) =>
        HttpResponse.json(params.playerTag === '#NEW1' ? RISKY_PROFILE : GOOD_PROFILE),
      ),
    );
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );

    const card = (await screen.findByText('Nouveau 2')).closest(
      '[data-testid="quarantine-card"]',
    ) as HTMLElement;
    await waitFor(() => {
      expect(within(card).getByText(/bon profil/i)).toBeInTheDocument();
    });
    expect(
      within(card).queryByRole('button', { name: /copier tag pour kick/i }),
    ).not.toBeInTheDocument();
  });

  it('signale une erreur d enrichissement pour un nouveau membre sans planter les autres', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', ({ params }) => {
        if (params.playerTag === '#NEW1') {
          return new HttpResponse(
            JSON.stringify({ error: { message: 'Indisponible.' } }),
            {
              status: 500,
            },
          );
        }
        return HttpResponse.json(GOOD_PROFILE);
      }),
    );
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );

    const card = (await screen.findByText('Nouveau 1')).closest(
      '[data-testid="quarantine-card"]',
    ) as HTMLElement;
    await waitFor(() => {
      expect(within(card).getByRole('alert')).toHaveTextContent('Indisponible.');
    });
  });

  it('affiche les trophees actuels du membre des l affichage de la carte (sans attendre l enrichissement)', () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => new Promise(() => undefined)),
    );
    render(
      <QuarantineSection
        clanTag="#20PP"
        clanState={success(CLAN)}
        logState={success(LOG)}
      />,
    );
    expect(screen.getByText('6000')).toBeInTheDocument();
    expect(screen.getByText('4500')).toBeInTheDocument();
  });
});
