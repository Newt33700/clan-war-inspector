import { describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: getMock }),
}));

describe('getServerTranslator', () => {
  it('traduit dans la langue du cookie', async () => {
    getMock.mockReturnValue({ value: 'es' });
    const { getServerTranslator } = await import('./get-translator');

    const t = await getServerTranslator();

    expect(t('footer.licenseLabel')).toBe('Licencia');
  });

  it('retombe sur le francais si aucun cookie de langue', async () => {
    getMock.mockReturnValue(undefined);
    const { getServerTranslator } = await import('./get-translator');

    const t = await getServerTranslator();

    expect(t('footer.licenseLabel')).toBe('Licence');
  });
});
