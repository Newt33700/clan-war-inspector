import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Footer } from './footer';

describe('Footer', () => {
  it('affiche la mention legale de non-affiliation a Supercell', () => {
    render(<Footer />);

    expect(
      screen.getByText(
        /n'est pas affilié, soutenu, sponsorisé ou spécifiquement approuvé/i,
      ),
    ).toBeInTheDocument();
  });

  it('affiche un lien cliquable vers la politique de contenus de fans, ouvert dans un nouvel onglet', () => {
    render(<Footer />);

    const link = screen.getByRole('link', { name: /fan-content-policy/i });
    expect(link).toHaveAttribute('href', 'https://www.supercell.com/fan-content-policy');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
