import { describe, expect, it } from 'vitest';
import fr from './dictionaries/fr';
import { translate } from './translate';

describe('translate', () => {
  it('resout une cle imbriquee', () => {
    expect(translate(fr, 'footer.licenseLabel')).toBe('Licence');
  });

  it('interpole les variables `{nom}`', () => {
    expect(translate(fr, 'clanSearch.memberCount', { count: 12 })).toBe('12/50 membres');
  });

  it('laisse un placeholder intact si la variable est absente', () => {
    expect(translate(fr, 'clanSearch.memberCount', {})).toBe('{count}/50 membres');
  });

  it('retourne la cle telle quelle si elle est introuvable', () => {
    expect(translate(fr, 'inconnu.absent')).toBe('inconnu.absent');
  });

  it('retourne la cle telle quelle si elle pointe vers un objet, pas une chaine', () => {
    expect(translate(fr, 'footer')).toBe('footer');
  });
});
