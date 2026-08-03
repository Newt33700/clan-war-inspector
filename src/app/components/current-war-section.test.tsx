/**
 * Tests du suivi en direct de la guerre en cours (US 4.1), en particulier
 * le masquage par defaut des anciens membres (audit UX du 2026-08-02,
 * US-1/US-3) : ce tableau, le plus consulte, ne doit plus laisser des
 * lignes inactionnables (ex-membres) polluer la lecture par defaut.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApiResource } from '@/hooks/use-api-resource';
import { CurrentWarSection } from './current-war-section';

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };

function successState(participants: unknown[]): ApiResource<unknown> {
  return {
    status: 'success',
    data: { state: 'war', periodType: 'warDay', clan: { participants } },
    refetch: () => undefined,
  };
}

const loading: ApiResource<unknown> = { status: 'loading', refetch: () => undefined };

describe('CurrentWarSection', () => {
  it('n affiche rien avant toute soumission (idle)', () => {
    const { container } = render(<CurrentWarSection warState={idle} memberTags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement (US 14.5)', () => {
    render(<CurrentWarSection warState={loading} memberTags={[]} />);
    expect(
      screen.getByRole('status', { name: /chargement de la guerre en cours/i }),
    ).toBeInTheDocument();
  });

  it('masque par defaut les participants ayant quitte le clan', () => {
    render(
      <CurrentWarSection
        warState={successState([
          { tag: '#P1', name: 'Present', decksUsedToday: 2, decksUsed: 8 },
          { tag: '#P2', name: 'Parti', decksUsedToday: 0, decksUsed: 0 },
        ])}
        memberTags={['#P1']}
      />,
    );
    // Le tableau desktop et les cartes mobiles (US 14.2) coexistent dans le
    // DOM (bascule au CSS) : on scope au tableau pour les tests non
    // specifiques a une vue.
    const table = screen.getByRole('table');
    expect(within(table).getByText('Present')).toBeInTheDocument();
    expect(within(table).queryByText('Parti')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('war-row')).toHaveLength(1);
    expect(screen.getAllByTestId('war-card')).toHaveLength(1);
  });

  it('propose un controle pour reafficher les anciens membres, avec leur nombre', () => {
    render(
      <CurrentWarSection
        warState={successState([
          { tag: '#P1', name: 'Present', decksUsedToday: 2, decksUsed: 8 },
          { tag: '#P2', name: 'Parti', decksUsedToday: 0, decksUsed: 0 },
        ])}
        memberTags={['#P1']}
      />,
    );
    const toggle = screen.getByRole('checkbox', { name: /anciens membres \(1\)/i });
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);

    expect(within(screen.getByRole('table')).getByText('Parti')).toBeInTheDocument();
    expect(screen.getAllByTestId('war-row')).toHaveLength(2);
    expect(screen.getAllByTestId('war-card')).toHaveLength(2);
  });

  it('n affiche pas le controle quand tous les participants sont membres actuels', () => {
    render(
      <CurrentWarSection
        warState={successState([
          { tag: '#P1', name: 'Present', decksUsedToday: 2, decksUsed: 8 },
        ])}
        memberTags={['#P1']}
      />,
    );
    expect(
      screen.queryByRole('checkbox', { name: /anciens membres/i }),
    ).not.toBeInTheDocument();
  });

  it('affiche un message distinct quand seuls des ex-membres ont participe', () => {
    render(
      <CurrentWarSection
        warState={successState([
          { tag: '#P2', name: 'Parti', decksUsedToday: 0, decksUsed: 0 },
        ])}
        memberTags={['#P1']}
      />,
    );
    expect(
      screen.getByText(/aucun membre actuel n a participe a cette guerre/i),
    ).toBeInTheDocument();
  });
});
