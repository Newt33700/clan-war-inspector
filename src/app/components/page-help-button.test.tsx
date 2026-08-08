import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PageHelpButton } from './page-help-button';

describe('PageHelpButton', () => {
  it("n'affiche pas la pop-up avant le premier clic", () => {
    render(<PageHelpButton page="dashboard" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ouvre une pop-up accessible avec le titre et le texte explicatif au clic', async () => {
    const user = userEvent.setup();
    render(<PageHelpButton page="dashboard" />);

    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName(/à quoi sert cette page/i);
    expect(dialog).toHaveTextContent(/participation de la semaine/i);
  });

  it('ferme la pop-up au clic sur le bouton de fermeture', async () => {
    const user = userEvent.setup();
    render(<PageHelpButton page="meteo" />);

    await user.click(screen.getByRole('button', { name: /météo/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /fermer/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ferme la pop-up sur Echap', async () => {
    const user = userEvent.setup();
    render(<PageHelpButton page="rh" />);

    await user.click(screen.getByRole('button', { name: /rh/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ferme la pop-up au clic sur le fond assombri', async () => {
    const user = userEvent.setup();
    render(<PageHelpButton page="historique" />);

    await user.click(screen.getByRole('button', { name: /historique/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('page-help-overlay'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('decoupe le texte explicatif en plusieurs paragraphes', async () => {
    const user = userEvent.setup();
    render(<PageHelpButton page="nouveauxMembres" />);

    await user.click(screen.getByRole('button', { name: /sas de quarantaine/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelectorAll('p').length).toBeGreaterThan(1);
  });
});
