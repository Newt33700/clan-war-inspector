/**
 * Tests de la jauge de progression partagee (US 12.1).
 */

import { render, screen } from '@/test-utils';
import { describe, expect, it } from 'vitest';
import { PlayerProgressBar } from './player-progress-bar';

describe('PlayerProgressBar', () => {
  it('affiche le score sur le maximum par defaut (16)', () => {
    render(<PlayerProgressBar score={7} />);
    expect(screen.getByText('7/16')).toBeInTheDocument();
  });

  it('accepte un maximum personnalise', () => {
    render(<PlayerProgressBar score={2} max={4} />);
    expect(screen.getByText('2/4')).toBeInTheDocument();
  });

  it('colore en rouge sous le seuil critique (< 8/16)', () => {
    render(<PlayerProgressBar score={7} />);
    expect(screen.getByText('7/16').className).toContain('text-royale-red-500');
    expect(screen.getByTestId('battle-gauge').className).toContain('bg-royale-red-500');
  });

  it('colore en orange entre le seuil et le maximum (8-15/16)', () => {
    render(<PlayerProgressBar score={8} />);
    expect(screen.getByText('8/16').className).toContain('text-orange-400');
    render(<PlayerProgressBar score={15} />);
    expect(screen.getByText('15/16').className).toContain('text-orange-400');
  });

  it('colore en vert au maximum (16/16)', () => {
    render(<PlayerProgressBar score={16} />);
    expect(screen.getByText('16/16').className).toContain('text-royale-green-500');
    expect(screen.getByTestId('battle-gauge').className).toContain('bg-royale-green-500');
  });

  it('remplit la barre proportionnellement au score', () => {
    render(<PlayerProgressBar score={8} />);
    expect(screen.getByTestId('battle-gauge')).toHaveStyle({ width: '50%' });
  });

  it('ecrete la largeur a 100% pour un score aberrant superieur au maximum', () => {
    render(<PlayerProgressBar score={99} />);
    expect(screen.getByTestId('battle-gauge')).toHaveStyle({ width: '100%' });
  });

  it('porte le niveau dans un aria-label, pas seulement la couleur', () => {
    render(<PlayerProgressBar score={0} />);
    expect(screen.getByLabelText('0 combats sur 16, Critique')).toBeInTheDocument();
  });
});
