import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguageSwitcher } from './language-switcher';
import { useTranslations } from './locale-provider';

function CurrentLocaleProbe() {
  const { locale } = useTranslations();
  return <span data-testid="current-locale">{locale}</span>;
}

describe('LanguageSwitcher', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('propose les 4 langues supportees, avec leur nom natif', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox', { name: /langue/i });
    expect(select).toHaveValue('fr');
    expect(screen.getByRole('option', { name: 'Français' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Italiano' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument();
  });

  it('change la langue active du contexte au choix', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSwitcher />
        <CurrentLocaleProbe />
      </>,
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('fr');

    await user.selectOptions(screen.getByRole('combobox', { name: /langue/i }), 'en');

    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
  });

  it('memorise la langue choisie (localStorage + cookie)', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.selectOptions(screen.getByRole('combobox', { name: /langue/i }), 'es');

    expect(window.localStorage.getItem('clan-war-inspector:locale')).toBe('es');
    expect(document.cookie).toContain('cwi_locale=es');
  });
});
