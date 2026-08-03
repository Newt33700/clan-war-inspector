/**
 * Tests du resume synthetique de participation (US 12.4).
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ApiResource } from '@/hooks/use-api-resource';
import { ParticipationSummarySection } from './participation-summary-section';

const idle: ApiResource<unknown> = { status: 'idle', refetch: () => undefined };
const loading: ApiResource<unknown> = { status: 'loading', refetch: () => undefined };
const error: ApiResource<unknown> = {
  status: 'error',
  message: 'Erreur',
  refetch: () => undefined,
};

function warSuccess(state: string, participants: unknown[]): ApiResource<unknown> {
  return {
    status: 'success',
    data: { state, periodType: 'warDay', clan: { participants } },
    refetch: () => undefined,
  };
}

describe('ParticipationSummarySection', () => {
  it('n affiche rien avant toute soumission de tag (idle)', () => {
    const { container } = render(
      <ParticipationSummarySection warState={idle} memberTags={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('n affiche rien en erreur (deja signalee par Guerre en cours)', () => {
    const { container } = render(
      <ParticipationSummarySection warState={error} memberTags={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche un squelette pendant le chargement', () => {
    render(<ParticipationSummarySection warState={loading} memberTags={[]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('affiche un message distinct quand le clan n est pas en guerre', () => {
    render(
      <ParticipationSummarySection
        warState={{
          status: 'success',
          data: { state: 'notInWar' },
          refetch: () => undefined,
        }}
        memberTags={[]}
      />,
    );
    expect(screen.getByText(/n est pas en guerre actuellement/i)).toBeInTheDocument();
  });

  it('calcule le pourcentage de participation parmi les membres actuels', () => {
    render(
      <ParticipationSummarySection
        warState={warSuccess('war', [
          { tag: '#A', decksUsed: 16 },
          { tag: '#B', decksUsed: 8 },
        ])}
        memberTags={['#A', '#B']}
      />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('24/32 combats')).toBeInTheDocument();
  });

  it('exclut les anciens membres du ratio', () => {
    render(
      <ParticipationSummarySection
        warState={warSuccess('war', [{ tag: '#A', decksUsed: 16 }])}
        memberTags={[]}
      />,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0/0 combats')).toBeInTheDocument();
  });

  it('porte le pourcentage et le detail dans un aria-label du donut', () => {
    render(
      <ParticipationSummarySection
        warState={warSuccess('war', [{ tag: '#A', decksUsed: 16 }])}
        memberTags={['#A']}
      />,
    );
    expect(
      screen.getByRole('img', {
        name: '100% des combats de la semaine joues, 16 sur 16',
      }),
    ).toBeInTheDocument();
  });
});
