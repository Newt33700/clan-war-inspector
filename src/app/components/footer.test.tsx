import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Footer } from './footer';

describe('Footer', () => {
  it('replie la mention legale par defaut derriere un lien "Licence"', () => {
    render(<Footer />);

    expect(screen.getByRole('button', { name: /licence/i })).toBeInTheDocument();
    expect(
      screen.queryByText(/n'est pas affilié, soutenu, sponsorisé/i),
    ).not.toBeInTheDocument();
  });

  it('affiche la mention legale de non-affiliation a Supercell au clic sur "Licence"', async () => {
    const user = userEvent.setup();
    render(<Footer />);

    await user.click(screen.getByRole('button', { name: /licence/i }));

    expect(
      screen.getByText(
        /n'est pas affilié, soutenu, sponsorisé ou spécifiquement approuvé/i,
      ),
    ).toBeInTheDocument();
  });

  it('affiche un lien cliquable vers la politique de contenus de fans, ouvert dans un nouvel onglet', async () => {
    const user = userEvent.setup();
    render(<Footer />);
    await user.click(screen.getByRole('button', { name: /licence/i }));

    const link = screen.getByRole('link', { name: /fan-content-policy/i });
    expect(link).toHaveAttribute('href', 'https://www.supercell.com/fan-content-policy');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
