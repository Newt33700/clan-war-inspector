import { render, screen } from '@/test-utils';
import { describe, expect, it } from 'vitest';
import { RouteLoadingSkeleton } from './route-loading-skeleton';

describe('RouteLoadingSkeleton', () => {
  it('expose un role status annoncant le chargement du clan', () => {
    render(<RouteLoadingSkeleton />);
    expect(
      screen.getByRole('status', { name: 'Chargement du clan' }),
    ).toBeInTheDocument();
  });
});
