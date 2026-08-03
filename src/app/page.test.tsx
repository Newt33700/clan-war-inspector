import { describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

import HomePage from './page';

describe('HomePage', () => {
  it('redirige inconditionnellement vers /dashboard (US 13.2)', () => {
    HomePage();

    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });
});
