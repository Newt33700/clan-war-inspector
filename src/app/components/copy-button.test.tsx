import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from './copy-button';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copie le texte et affiche une confirmation pendant 2 secondes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<CopyButton text="#20J20QG" />);

    await user.click(screen.getByRole('button', { name: /copier le tag/i }));

    expect(writeText).toHaveBeenCalledWith('#20J20QG');
    expect(screen.getByRole('button', { name: /copie/i })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByRole('button', { name: /^copier le tag$/i })).toBeInTheDocument();
  });

  it('reste silencieux si le presse-papiers echoue', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });

    render(<CopyButton text="#20J20QG" />);

    await user.click(screen.getByRole('button', { name: /copier le tag/i }));

    expect(screen.getByRole('button', { name: /^copier le tag$/i })).toBeInTheDocument();
  });

  it('accepte un libelle personnalise', () => {
    render(<CopyButton text="#A" label="Copier" />);
    expect(screen.getByRole('button', { name: 'Copier' })).toBeInTheDocument();
  });
});
