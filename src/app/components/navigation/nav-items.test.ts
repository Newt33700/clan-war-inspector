import { describe, expect, it } from 'vitest';
import { isNavItemActive } from './nav-items';

describe('isNavItemActive', () => {
  it('est actif sur une correspondance exacte', () => {
    expect(isNavItemActive('/historique', '/historique')).toBe(true);
  });

  it('est actif sur une sous-route', () => {
    expect(isNavItemActive('/historique/detail', '/historique')).toBe(true);
  });

  it('n est pas actif sur un prefixe de nom de route sans separateur', () => {
    expect(isNavItemActive('/rhum', '/rh')).toBe(false);
  });

  it('n est pas actif sur une autre route', () => {
    expect(isNavItemActive('/dashboard', '/rh')).toBe(false);
  });
});
