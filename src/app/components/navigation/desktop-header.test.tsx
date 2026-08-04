import { render, screen } from '@/test-utils';
import { describe, expect, it, vi } from 'vitest';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

import { DesktopHeader } from './desktop-header';

describe('DesktopHeader', () => {
  it('affiche le nom du produit et les 5 routes', () => {
    usePathnameMock.mockReturnValue('/rh');
    render(<DesktopHeader />);

    expect(screen.getByRole('link', { name: /clan war inspector/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^rh$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: /nouveaux/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /météo/i })).toBeInTheDocument();
  });

  it('affiche une icone a cote de chaque route (retour utilisateur 2026-08-04)', () => {
    usePathnameMock.mockReturnValue('/rh');
    render(<DesktopHeader />);

    expect(
      screen.getByRole('link', { name: /^rh$/i }).querySelector('svg'),
    ).not.toBeNull();
    expect(
      screen.getByRole('link', { name: /dashboard/i }).querySelector('svg'),
    ).not.toBeNull();
  });
});
