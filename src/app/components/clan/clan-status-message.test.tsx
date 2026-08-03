import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiResource } from '@/hooks/use-api-resource';
import { ClanStatusMessage } from './clan-status-message';

describe('ClanStatusMessage', () => {
  it('affiche le message idle', () => {
    const state: ApiResource<unknown> = { status: 'idle', refetch: vi.fn() };
    render(<ClanStatusMessage state={state} idleMessage="Saisissez un tag." />);

    expect(screen.getByText('Saisissez un tag.')).toBeInTheDocument();
  });

  it('affiche un etat de chargement', () => {
    const state: ApiResource<unknown> = { status: 'loading', refetch: vi.fn() };
    render(<ClanStatusMessage state={state} idleMessage="idle" />);

    expect(screen.getByRole('status')).toHaveTextContent(/chargement/i);
  });

  it('affiche l erreur et permet de reessayer', async () => {
    const refetch = vi.fn();
    const state: ApiResource<unknown> = { status: 'error', message: 'Boom.', refetch };
    render(<ClanStatusMessage state={state} idleMessage="idle" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Boom.');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reessayer/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('ne rend rien une fois le clan charge', () => {
    const state: ApiResource<unknown> = { status: 'success', data: {}, refetch: vi.fn() };
    const { container } = render(<ClanStatusMessage state={state} idleMessage="idle" />);

    expect(container).toBeEmptyDOMElement();
  });
});
