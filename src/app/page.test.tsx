import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('affiche le nom du produit en titre principal', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /clan war inspector/i }),
    ).toBeInTheDocument();
  });

  it('rend le dashboard membres avec son formulaire de recherche', () => {
    render(<HomePage />);

    expect(screen.getByRole('form', { name: /recherche de clan/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tag ou nom du clan/i)).toBeInTheDocument();
  });
});
