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

  it('decrit la jauge d assiduite pour les lecteurs d ecran', () => {
    render(<HomePage />);

    expect(screen.getByRole('img', { name: '11 combats sur 16' })).toBeInTheDocument();
  });

  it('rend un segment par combat hebdomadaire', () => {
    render(<HomePage />);

    expect(screen.getAllByTestId('battle-segment')).toHaveLength(16);
  });

  it('liste les briques du socle technique', () => {
    render(<HomePage />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});
