import { describe, expect, it } from 'vitest';

import {
  CLAN_TAG_ALLOWED_CHARACTERS,
  CLAN_TAG_MAX_LENGTH,
  CLAN_TAG_MIN_LENGTH,
  InvalidClanTagError,
  isValidClanTag,
  normalizeClanTag,
  toApiTagSegment,
} from './clan-tag';

/** Construit un tag valide de la longueur demandee. */
const tagOfLength = (length: number): string => 'P'.repeat(length);

/** Capture l erreur levee, ou echoue si la normalisation a reussi. */
const captureError = (input: string): InvalidClanTagError => {
  try {
    normalizeClanTag(input);
  } catch (error) {
    if (error instanceof InvalidClanTagError) {
      return error;
    }
    throw error;
  }
  throw new Error(`normalizeClanTag(${JSON.stringify(input)}) aurait du lever une erreur`);
};

describe('normalizeClanTag', () => {
  it('prefixe le tag canonique d un unique diese', () => {
    expect(normalizeClanTag('2PP')).toBe('#2PP');
  });

  it('conserve un tag deja prefixe', () => {
    expect(normalizeClanTag('#2PP')).toBe('#2PP');
  });

  it('supprime les dieses multiples en tete', () => {
    expect(normalizeClanTag('##2PP')).toBe('#2PP');
  });

  it('supprime les espaces autour de la saisie', () => {
    expect(normalizeClanTag('  #2PP  ')).toBe('#2PP');
  });

  it('met la saisie en majuscules', () => {
    expect(normalizeClanTag('#pylq')).toBe('#PYLQ');
  });

  it('corrige la lettre O majuscule en chiffre 0', () => {
    expect(normalizeClanTag('#2OPP')).toBe('#20PP');
  });

  it('corrige la lettre o minuscule en chiffre 0', () => {
    expect(normalizeClanTag('#2opp')).toBe('#20PP');
  });

  it('corrige toutes les occurrences de O, pas seulement la premiere', () => {
    expect(normalizeClanTag('#OO2PP')).toBe('#002PP');
  });

  it('accepte chaque caractere de l alphabet officiel', () => {
    expect(normalizeClanTag(CLAN_TAG_ALLOWED_CHARACTERS)).toBe(
      `#${CLAN_TAG_ALLOWED_CHARACTERS}`,
    );
  });

  describe('longueur', () => {
    it(`accepte exactement ${CLAN_TAG_MIN_LENGTH} caracteres`, () => {
      const tag = tagOfLength(CLAN_TAG_MIN_LENGTH);
      expect(normalizeClanTag(tag)).toBe(`#${tag}`);
    });

    it(`rejette ${CLAN_TAG_MIN_LENGTH - 1} caracteres`, () => {
      expect(() => normalizeClanTag(tagOfLength(CLAN_TAG_MIN_LENGTH - 1))).toThrow(
        InvalidClanTagError,
      );
    });

    it(`accepte exactement ${CLAN_TAG_MAX_LENGTH} caracteres`, () => {
      const tag = tagOfLength(CLAN_TAG_MAX_LENGTH);
      expect(normalizeClanTag(tag)).toBe(`#${tag}`);
    });

    it(`rejette ${CLAN_TAG_MAX_LENGTH + 1} caracteres`, () => {
      expect(() => normalizeClanTag(tagOfLength(CLAN_TAG_MAX_LENGTH + 1))).toThrow(
        InvalidClanTagError,
      );
    });

    it('ne compte pas le diese dans la longueur', () => {
      const tag = tagOfLength(CLAN_TAG_MAX_LENGTH);
      expect(normalizeClanTag(`#${tag}`)).toBe(`#${tag}`);
    });
  });

  describe('motifs de rejet', () => {
    const cases = [
      { label: 'chaine vide', input: '', reason: 'EMPTY' },
      { label: 'espaces seuls', input: '   ', reason: 'EMPTY' },
      { label: 'diese seul', input: '#', reason: 'EMPTY' },
      { label: 'trop court', input: 'PY', reason: 'TOO_SHORT' },
      { label: 'trop long', input: tagOfLength(15), reason: 'TOO_LONG' },
      { label: 'lettre hors alphabet', input: '#2PZ', reason: 'INVALID_CHARACTER' },
      { label: 'diese au milieu', input: 'PY#LQ', reason: 'INVALID_CHARACTER' },
      { label: 'espace au milieu', input: 'PY LQ', reason: 'INVALID_CHARACTER' },
      { label: 'caractere accentue', input: '#2PÉ', reason: 'INVALID_CHARACTER' },
    ] as const;

    it.each(cases)('rejette $label avec le motif $reason', ({ input, reason }) => {
      expect(captureError(input).reason).toBe(reason);
    });

    it('nomme l erreur InvalidClanTagError', () => {
      expect(captureError('#2PZ').name).toBe('InvalidClanTagError');
    });

    it('expose la saisie d origine dans l erreur', () => {
      expect(captureError('  #2PZ  ').input).toBe('  #2PZ  ');
    });

    it('produit un message distinct et non vide par motif', () => {
      const messages = ['', 'PY', tagOfLength(15), '#2PZ'].map(
        (input) => captureError(input).message,
      );

      expect(messages.every((message) => message.length > 0)).toBe(true);
      expect(new Set(messages).size).toBe(messages.length);
    });

    it('mentionne la longueur minimale dans le message trop court', () => {
      expect(() => normalizeClanTag('PY')).toThrow(String(CLAN_TAG_MIN_LENGTH));
    });

    it('mentionne la longueur maximale dans le message trop long', () => {
      expect(() => normalizeClanTag(tagOfLength(15))).toThrow(String(CLAN_TAG_MAX_LENGTH));
    });

    it('mentionne l alphabet autorise dans le message de caractere invalide', () => {
      expect(() => normalizeClanTag('#2PZ')).toThrow(CLAN_TAG_ALLOWED_CHARACTERS);
    });
  });
});

describe('isValidClanTag', () => {
  it('retourne true pour un tag valide', () => {
    expect(isValidClanTag('#2PP')).toBe(true);
  });

  it('retourne true pour un tag valide mal formate', () => {
    expect(isValidClanTag('  2pp ')).toBe(true);
  });

  it('retourne false pour un tag invalide', () => {
    expect(isValidClanTag('#2PZ')).toBe(false);
  });

  it('retourne false pour une chaine vide', () => {
    expect(isValidClanTag('')).toBe(false);
  });
});

describe('toApiTagSegment', () => {
  it('encode le diese en %23', () => {
    expect(toApiTagSegment('#2PP')).toBe('%232PP');
  });

  it('normalise avant d encoder', () => {
    expect(toApiTagSegment(' 2opp ')).toBe('%2320PP');
  });

  it('propage l erreur de validation', () => {
    expect(() => toApiTagSegment('#2PZ')).toThrow(InvalidClanTagError);
  });
});
