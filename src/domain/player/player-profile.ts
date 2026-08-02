/**
 * Profil detaille d'un joueur (US 9) : parsing defensif de /players/{tag}.
 * Fonction pure, sans dependance reseau ni framework, comme le reste du
 * domaine (US 4.2, US 6.1).
 */

import { canonicalizePlayerTag } from '../clan/player-tag';
import type { ClanRole } from '../clan/members';

export interface PlayerDeckCard {
  name: string;
  iconUrl: string;
  level: number;
}

export interface PlayerProfile {
  tag: string;
  name: string;
  /** `null` si le joueur n'est dans aucun clan ou role inconnu. */
  role: ClanRole | null;
  expLevel: number;
  donations: number;
  /** Jusqu'a 8 cartes : `currentDeck` en priorite, repli sur `currentFavouriteCard`. */
  deck: PlayerDeckCard[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toSafeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

function toRole(value: unknown): ClanRole | null {
  if (
    value === 'leader' ||
    value === 'coLeader' ||
    value === 'elder' ||
    value === 'member'
  ) {
    return value;
  }
  return null;
}

function toCard(candidate: unknown): PlayerDeckCard | null {
  if (!isRecord(candidate)) {
    return null;
  }
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const iconUrls = candidate.iconUrls;
  const iconUrl =
    isRecord(iconUrls) && typeof iconUrls.medium === 'string' ? iconUrls.medium : '';
  return { name, iconUrl, level: toSafeCount(candidate.level) };
}

function toDeck(raw: UnknownRecord): PlayerDeckCard[] {
  if (Array.isArray(raw.currentDeck) && raw.currentDeck.length > 0) {
    return raw.currentDeck
      .map(toCard)
      .filter((card): card is PlayerDeckCard => card !== null);
  }
  const favourite = toCard(raw.currentFavouriteCard);
  return favourite === null ? [] : [favourite];
}

/**
 * Extrait le profil d'une reponse brute de /players/{tag}.
 * `null` si la reponse n'a meme pas de tag exploitable.
 */
export function parsePlayerProfile(raw: unknown): PlayerProfile | null {
  if (!isRecord(raw)) {
    return null;
  }
  const tag = canonicalizePlayerTag(raw.tag);
  if (tag === null) {
    return null;
  }

  const name = typeof raw.name === 'string' && raw.name.length > 0 ? raw.name : tag;

  return {
    tag,
    name,
    role: toRole(raw.role),
    expLevel: toSafeCount(raw.expLevel),
    donations: toSafeCount(raw.donations),
    deck: toDeck(raw),
  };
}
