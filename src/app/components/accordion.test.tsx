import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion } from './accordion';

describe('Accordion', () => {
  it('affiche le resume mais pas le detail tant que ferme', () => {
    render(
      <Accordion summary={<span>Resume</span>}>
        <p>Detail secret</p>
      </Accordion>,
    );
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.queryByText('Detail secret')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('deplie le detail au clic et le replie au second clic', async () => {
    const user = userEvent.setup();
    render(
      <Accordion summary={<span>Resume</span>}>
        <p>Detail secret</p>
      </Accordion>,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Detail secret')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Detail secret')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });
});
