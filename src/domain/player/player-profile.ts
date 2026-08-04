/**
 * Profil detaille d'un joueur (US 9) : parsing defensif de /players/{tag}.
 * Fonction pure, sans dependance reseau ni framework, comme le reste du
 * domaine (US 4.2, US 6.1).
 */

import { canonicalizePlayerTag } from '../clan/player-tag';
import type { ClanRole } from '../clan/members';
import { toSafeCount } from '../shared/numeric';

export interface PlayerDeckCard {
  name: string;
  iconUrl: string;
  level: number;
  /** Niveau maximum de la carte (echelle propre a sa rarete). */
  maxLevel: number;
  elixirCost: number;
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
  /** Toutes les cartes debloquees par le joueur (`cards`), retour utilisateur 2026-08-04. */
  cards: PlayerDeckCard[];
  /** Statistiques de carriere (retour utilisateur 2026-08-04, inspiration StatsRoyale). */
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  /** Dons cumules a vie (distinct de `donations`, la semaine en cours). */
  totalDonations: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
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
  return {
    name,
    iconUrl,
    level: toSafeCount(candidate.level),
    maxLevel: toSafeCount(candidate.maxLevel),
    elixirCost: toSafeCount(candidate.elixirCost),
  };
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

/** Collection complete du joueur (`cards`) : absente si l'API ne l'expose pas. */
function toCards(raw: UnknownRecord): PlayerDeckCard[] {
  if (!Array.isArray(raw.cards)) {
    return [];
  }
  return raw.cards.map(toCard).filter((card): card is PlayerDeckCard => card !== null);
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
    cards: toCards(raw),
    wins: toSafeCount(raw.wins),
    losses: toSafeCount(raw.losses),
    battleCount: toSafeCount(raw.battleCount),
    threeCrownWins: toSafeCount(raw.threeCrownWins),
    totalDonations: toSafeCount(raw.totalDonations),
  };
}
