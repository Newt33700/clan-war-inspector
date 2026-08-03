/**
 * Tests du Sparkline (US 12) : mini-courbe SVG pure, sans librairie de
 * graphiques (interdiction explicite de la spec).
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from './sparkline';

describe('Sparkline', () => {
  it('rend un svg aux dimensions par defaut (80x30)', () => {
    render(
      <Sparkline
        values={[16, 16, 15, 16, 16]}
        colorClassName="stroke-royale-green-500"
      />,
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '30');
    expect(svg).toHaveAttribute('viewBox', '0 0 80 30');
  });

  it('accepte des dimensions personnalisees', () => {
    render(
      <Sparkline
        values={[1, 2]}
        colorClassName="stroke-royale-green-500"
        width={100}
        height={40}
      />,
    );
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '40');
  });

  it('dessine autant de points que de valeurs fournies', () => {
    render(
      <Sparkline values={[0, 4, 8, 12, 16]} colorClassName="stroke-royale-green-500" />,
    );
    const points = screen.getByTestId('sparkline-line').getAttribute('points');
    expect(points?.trim().split(' ')).toHaveLength(5);
  });

  it('applique la classe de couleur donnee au trait', () => {
    render(<Sparkline values={[8, 8]} colorClassName="stroke-orange-400" />);
    expect(screen.getByTestId('sparkline-line').getAttribute('class')).toContain(
      'stroke-orange-400',
    );
  });

  it('place la valeur maximale (16) tout en haut (y = 0)', () => {
    render(
      <Sparkline values={[16]} colorClassName="stroke-royale-green-500" height={30} />,
    );
    const points = screen.getByTestId('sparkline-line').getAttribute('points')!.trim();
    const [, y] = points.split(',').map(Number);
    expect(y).toBe(0);
  });

  it('place la valeur minimale (0) tout en bas (y = hauteur)', () => {
    render(
      <Sparkline values={[0]} colorClassName="stroke-royale-green-500" height={30} />,
    );
    const points = screen.getByTestId('sparkline-line').getAttribute('points')!.trim();
    const [, y] = points.split(',').map(Number);
    expect(y).toBe(30);
  });

  it('etale les points sur toute la largeur, du premier a x=0 au dernier a x=largeur', () => {
    render(
      <Sparkline
        values={[8, 8, 8, 8, 8]}
        colorClassName="stroke-royale-green-500"
        width={80}
      />,
    );
    const points = screen
      .getByTestId('sparkline-line')
      .getAttribute('points')!
      .trim()
      .split(' ');
    const firstX = Number(points[0]!.split(',')[0]);
    const lastX = Number(points[points.length - 1]!.split(',')[0]);
    expect(firstX).toBe(0);
    expect(lastX).toBe(80);
  });

  it('ecrete une valeur aberrante superieure au maximum (n affiche jamais y negatif)', () => {
    render(
      <Sparkline values={[99]} colorClassName="stroke-royale-green-500" height={30} />,
    );
    const points = screen.getByTestId('sparkline-line').getAttribute('points')!.trim();
    const [, y] = points.split(',').map(Number);
    expect(y).toBe(0);
  });

  it('ecrete une valeur aberrante negative (n affiche jamais y > hauteur)', () => {
    render(
      <Sparkline values={[-5]} colorClassName="stroke-royale-green-500" height={30} />,
    );
    const points = screen.getByTestId('sparkline-line').getAttribute('points')!.trim();
    const [, y] = points.split(',').map(Number);
    expect(y).toBe(30);
  });

  it('porte un aria-label decrivant les valeurs, pas seulement visuel', () => {
    render(
      <Sparkline
        values={[16, 16, 15, 16, 16]}
        colorClassName="stroke-royale-green-500"
      />,
    );
    expect(screen.getByRole('img', { name: /16, 16, 15, 16, 16/ })).toBeInTheDocument();
  });

  it('ne rend rien pour un tableau de valeurs vide', () => {
    const { container } = render(
      <Sparkline values={[]} colorClassName="stroke-royale-green-500" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('ne plante pas avec une seule valeur (place un point unique)', () => {
    render(<Sparkline values={[10]} colorClassName="stroke-royale-green-500" />);
    const points = screen.getByTestId('sparkline-line').getAttribute('points')!.trim();
    expect(points.split(' ')).toHaveLength(1);
  });
});
