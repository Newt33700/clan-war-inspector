import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KofiButton } from './kofi-button';

describe('KofiButton', () => {
  it('affiche un lien vers la page Ko-fi du projet, ouvert dans un nouvel onglet', () => {
    render(<KofiButton />);

    const link = screen.getByRole('link', { name: /faire un don sur ko-fi/i });
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/clanwarinspector');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
