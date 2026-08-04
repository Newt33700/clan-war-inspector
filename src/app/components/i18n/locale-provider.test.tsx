import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider, useTranslations } from './locale-provider';

function Probe() {
  const { t } = useTranslations();
  return <span>{t('footer.licenseLabel')}</span>;
}

describe('LocaleProvider / useTranslations', () => {
  it('leve une erreur si utilise hors de <LocaleProvider>', () => {
    // Rendu direct (RTL non enveloppee, contrairement a `@/test-utils`) :
    // c'est precisement l'absence de provider qu'on veut ici.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow(
      'useTranslations doit etre utilise sous <LocaleProvider>.',
    );

    spy.mockRestore();
  });

  it('traduit dans la langue initiale fournie', () => {
    render(
      <LocaleProvider initialLocale="en">
        <Probe />
      </LocaleProvider>,
    );

    expect(screen.getByText('License')).toBeInTheDocument();
  });

  it('retombe sur le francais si aucune langue initiale n est fournie', () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );

    expect(screen.getByText('Licence')).toBeInTheDocument();
  });
});
