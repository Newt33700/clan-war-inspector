import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { mockServer } from '@/mocks/server';
import { FIXTURE_PLAYER_PROFILE, FIXTURE_PLAYER_PROFILE_NO_DECK } from '@/mocks/fixtures';
import { PlayerDrawer } from './player-drawer';

describe('PlayerDrawer', () => {
  it('reste ferme (translate-x-full) quand tag est null', () => {
    render(<PlayerDrawer tag={null} onClose={vi.fn()} />);
    expect(
      screen
        .getByRole('heading', { name: /profil joueur/i, hidden: true })
        .closest('aside'),
    ).toHaveClass('translate-x-full');
  });

  it('s ouvre (translate-x-0) et affiche un squelette pendant le chargement', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json(FIXTURE_PLAYER_PROFILE);
      }),
    );
    render(<PlayerDrawer tag="#PLAYER1" onClose={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: /profil joueur/i }).closest('aside'),
    ).toHaveClass('translate-x-0');
    expect(screen.getByTestId('drawer-skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('drawer-skeleton')).not.toBeInTheDocument();
    });
  });

  it('affiche le role, le niveau, les dons et le deck complet (8 cartes)', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () =>
        HttpResponse.json(FIXTURE_PLAYER_PROFILE),
      ),
    );
    render(<PlayerDrawer tag="#PLAYER1" onClose={vi.fn()} />);

    expect(await screen.findByText('Joueur 1')).toBeInTheDocument();
    expect(screen.getByText('Chef')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getAllByTestId('deck-card')).toHaveLength(8);
  });

  it('replie sur currentFavouriteCard quand currentDeck est absent', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () =>
        HttpResponse.json(FIXTURE_PLAYER_PROFILE_NO_DECK),
      ),
    );
    render(<PlayerDrawer tag="#PLAYER2" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('deck-card')).toHaveLength(1);
    });
    expect(screen.getByText('Carte Favorite')).toBeInTheDocument();
  });

  it('affiche un etat vide illustre quand aucun deck n est exploitable', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () =>
        HttpResponse.json({ tag: '#P4', name: 'Joueur 4' }),
      ),
    );
    render(<PlayerDrawer tag="#P4" onClose={vi.fn()} />);

    expect(await screen.findByText(/deck indisponible/i)).toBeInTheDocument();
  });

  it('affiche un espace reserve quand l icone d une carte est absente', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () =>
        HttpResponse.json({
          tag: '#P3',
          name: 'Joueur 3',
          currentDeck: [{ name: 'Sans icone', level: 5 }],
        }),
      ),
    );
    render(<PlayerDrawer tag="#P3" onClose={vi.fn()} />);

    const card = await screen.findByTestId('deck-card');
    expect(card.querySelector('img')).not.toBeInTheDocument();
  });

  it('affiche une erreur si le joueur n est pas trouve', async () => {
    mockServer.use(
      http.get('*/api/players/:playerTag', () => new HttpResponse(null, { status: 404 })),
    );
    render(<PlayerDrawer tag="#INCONNU" onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('appelle onClose au clic sur l overlay', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PlayerDrawer tag="#PLAYER1" onClose={onClose} />);

    await user.click(screen.getByTestId('player-drawer-overlay'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose au clic sur le bouton fermer', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PlayerDrawer tag="#PLAYER1" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /fermer le panneau/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
