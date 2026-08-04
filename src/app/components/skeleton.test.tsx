import { render, screen } from '@/test-utils';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('expose un role status quand un libelle est fourni', () => {
    render(<Skeleton label="Chargement du profil" />);
    expect(
      screen.getByRole('status', { name: 'Chargement du profil' }),
    ).toBeInTheDocument();
  });

  it('reste purement decoratif sans libelle', () => {
    render(<Skeleton />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
