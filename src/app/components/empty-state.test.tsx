import { render, screen } from '@/test-utils';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('affiche le titre et la description', () => {
    render(
      <EmptyState icon={<span>icone</span>} title="Rien ici" description="Explication" />,
    );
    expect(screen.getByText('Rien ici')).toBeInTheDocument();
    expect(screen.getByText('Explication')).toBeInTheDocument();
  });

  it('n affiche pas de description quand absente', () => {
    render(<EmptyState icon={<span>icone</span>} title="Rien ici" />);
    expect(screen.getByText('Rien ici')).toBeInTheDocument();
    expect(screen.queryByText('Explication')).not.toBeInTheDocument();
  });
});
