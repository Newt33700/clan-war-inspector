import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePathnameMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

import { MobileTabBar } from './mobile-tab-bar';

describe('MobileTabBar', () => {
  it('affiche les 3 routes', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    render(<MobileTabBar />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /historique/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^rh$/i })).toBeInTheDocument();
  });

  it('met en avant la route active en jaune, les autres en gris', () => {
    usePathnameMock.mockReturnValue('/historique');
    render(<MobileTabBar />);

    const active = screen.getByRole('link', { name: /historique/i });
    const inactive = screen.getByRole('link', { name: /dashboard/i });

    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('text-yellow-400');
    expect(inactive).not.toHaveAttribute('aria-current');
    expect(inactive.className).toContain('text-slate-400');
  });
});
