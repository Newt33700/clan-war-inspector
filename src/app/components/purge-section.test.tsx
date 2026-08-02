/**
 * Tests de la vue de renvoi (US 5.1), en particulier le resume de regle
 * active et la persistance du reglage (audit UX du 2026-08-02, US-9).
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import { PurgeSection } from './purge-section';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    expLevel: 10,
    trophies: 5000,
    donations: 0,
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('PurgeSection', () => {
  it('affiche un resume texte de la regle active au dessus de la liste', () => {
    render(<PurgeSection members={[]} attendance={[]} ready />);
    expect(screen.getByText(/regle active/i)).toHaveTextContent(
      'Regle active : 0 don ET moins de 8 combats de guerre.',
    );
  });

  it('memorise le seuil et le combinateur entre deux montages', () => {
    const { unmount } = render(<PurgeSection members={[]} attendance={[]} ready />);
    fireEvent.change(screen.getByLabelText(/combinaison des criteres/i), {
      target: { value: 'OR' },
    });
    fireEvent.change(screen.getByLabelText(/seuil de combats de guerre/i), {
      target: { value: '10' },
    });
    unmount();

    render(<PurgeSection members={[]} attendance={[]} ready />);
    expect(screen.getByText(/regle active/i)).toHaveTextContent(
      'Regle active : 0 don OU moins de 10 combats de guerre.',
    );
    expect(screen.getByLabelText(/combinaison des criteres/i)).toHaveValue('OR');
  });

  it('n affiche rien tant que les donnees ne sont pas pretes', () => {
    const { container } = render(
      <PurgeSection members={[]} attendance={[]} ready={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('liste un candidat avec ses motifs', () => {
    const candidate = member({ tag: '#A', name: 'Alice', donations: 0 });
    render(<PurgeSection members={[candidate]} attendance={[]} ready />);
    expect(screen.getByTestId('purge-row')).toHaveTextContent('Alice');
  });

  it('affiche une erreur si la copie echoue', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    const candidate = member({ tag: '#A', name: 'Alice', donations: 0 });
    render(<PurgeSection members={[candidate]} attendance={[]} ready />);

    fireEvent.click(screen.getByRole('button', { name: /copier la liste/i }));

    expect(await screen.findByText(/impossible de copier/i)).toBeInTheDocument();
    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });
});
