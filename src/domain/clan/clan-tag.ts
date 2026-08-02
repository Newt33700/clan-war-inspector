/**
 * Normalisation des tags de clan Clash Royale.
 *
 * Logique metier pure : aucune dependance reseau, aucun import React.
 * Ce module est la premiere brique consommee par le proxy API (US 1.5), qui
 * ne doit jamais transmettre a Supercell un tag saisi tel quel par un humain.
 */

/** Alphabet officiel des tags Supercell. Le "O" et le "0" y sont ambigus. */
export const CLAN_TAG_ALLOWED_CHARACTERS = '0289PYLQGRJCUV';

export const CLAN_TAG_MIN_LENGTH = 3;
export const CLAN_TAG_MAX_LENGTH = 14;

export type ClanTagRejectionReason =
  'EMPTY' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_CHARACTER';

const REJECTION_MESSAGES: Record<ClanTagRejectionReason, string> = {
  EMPTY: 'Saisissez un tag de clan.',
  TOO_SHORT: `Un tag de clan compte au moins ${CLAN_TAG_MIN_LENGTH} caracteres.`,
  TOO_LONG: `Un tag de clan compte au plus ${CLAN_TAG_MAX_LENGTH} caracteres.`,
  INVALID_CHARACTER: `Un tag de clan n'utilise que les caracteres ${CLAN_TAG_ALLOWED_CHARACTERS}.`,
};

export class InvalidClanTagError extends Error {
  readonly reason: ClanTagRejectionReason;
  readonly input: string;

  constructor(reason: ClanTagRejectionReason, input: string) {
    super(REJECTION_MESSAGES[reason]);
    this.name = 'InvalidClanTagError';
    this.reason = reason;
    this.input = input;
  }
}

/**
 * Nettoie et valide un tag saisi par l'utilisateur.
 *
 * Tolere les espaces, la casse, les diezes multiples et la confusion O / 0.
 * @returns le tag canonique, prefixe d'un unique diese (ex. `#20PP`).
 * @throws {InvalidClanTagError} si le tag ne peut pas exister chez Supercell.
 */
export function normalizeClanTag(input: string): string {
  const candidate = input.trim().toUpperCase().replace(/^#+/, '').replaceAll('O', '0');

  if (candidate.length === 0) {
    throw new InvalidClanTagError('EMPTY', input);
  }
  if (candidate.length < CLAN_TAG_MIN_LENGTH) {
    throw new InvalidClanTagError('TOO_SHORT', input);
  }
  if (candidate.length > CLAN_TAG_MAX_LENGTH) {
    throw new InvalidClanTagError('TOO_LONG', input);
  }

  for (const character of candidate) {
    if (!CLAN_TAG_ALLOWED_CHARACTERS.includes(character)) {
      throw new InvalidClanTagError('INVALID_CHARACTER', input);
    }
  }

  return `#${candidate}`;
}

/** Variante non levante, pour piloter l'etat d'un formulaire. */
export function isValidClanTag(input: string): boolean {
  try {
    normalizeClanTag(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encode un tag pour l'inserer dans un chemin d'URL Supercell.
 * Le diese doit imperativement devenir `%23`, sinon il est lu comme un fragment.
 */
export function toApiTagSegment(input: string): string {
  return encodeURIComponent(normalizeClanTag(input));
}
