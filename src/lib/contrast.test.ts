/**
 * Tests du calcul de contraste WCAG (US 6.8).
 * Valeurs de reference verifiees sur webaim.org/resources/contrastchecker.
 */

import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from './contrast';

describe('relativeLuminance', () => {
  it('vaut 0 pour le noir', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('vaut 1 pour le blanc', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('tolere les composantes hexadecimales en minuscule ou majuscule', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(relativeLuminance('#ffffff'), 10);
  });
});

describe('contrastRatio', () => {
  it('vaut 21:1 entre noir et blanc, l ordre des arguments n important pas', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
  });

  it('vaut 1:1 pour deux couleurs identiques', () => {
    expect(contrastRatio('#e2432f', '#e2432f')).toBeCloseTo(1, 5);
  });

  it('correspond a une valeur de reference connue', () => {
    // #ffcb3d (or) sur #071233 (navy) : reference calculee manuellement.
    expect(contrastRatio('#ffcb3d', '#071233')).toBeCloseTo(12.12, 1);
  });
});
