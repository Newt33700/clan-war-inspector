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
  /** Artwork "evolue" (`iconUrls.evolutionMedium`) si `isEvolved`, sinon l'artwork standard. */
  iconUrl: string;
  level: number;
  /** Niveau maximum de la carte (echelle propre a sa rarete). */
  maxLevel: number;
  elixirCost: number;
  /** Vrai si le joueur a actuellement equipe l'evolution de cette carte. */
  isEvolved: boolean;
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

/**
 * L'API Supercell renvoie un niveau de carte relatif a sa rarete (1 =
 * niveau minimum obtenable pour cette carte), pas le niveau affiche dans
 * le jeu sur l'echelle unifiee : sans cet offset, toute carte non commune
 * (rare/epique/legendaire/championne) affiche un niveau bien trop bas
 * (retour utilisateur 2026-08-05, capture d'ecran in-game vs API a
 * l'appui). Applique aussi bien a `level` qu'a `maxLevel` : les deux
 * viennent de la meme echelle brute, sinon `level` peut depasser
 * `maxLevel` une fois seul `level` corrige. Verifie sur donnees reelles
 * (joueur #8U9QRQ8C) : Balloon (epique) niveau API 11 -> niveau affiche
 * 16 (+5) ; Miner (legendaire) niveau API 7 -> niveau affiche 15 (+8).
 */
const RARITY_LEVEL_OFFSET: Record<string, number> = {
  common: 0,
  rare: 2,
  epic: 5,
  legendary: 8,
  champion: 10,
};

function rarityOffset(rarity: unknown): number {
  return typeof rarity === 'string'
    ? (RARITY_LEVEL_OFFSET[rarity.toLowerCase()] ?? 0)
    : 0;
}

/**
 * Artwork a afficher pour une carte : l'API expose une image dediee
 * `iconUrls.evolutionMedium` (aura speciale) pour toute carte dont
 * l'evolution est actuellement equipee (`evolutionLevel > 0`) -- sinon
 * repli sur l'artwork standard `iconUrls.medium` (retour utilisateur
 * 2026-08-05).
 */
function toIconUrl(iconUrls: unknown, isEvolved: boolean): string {
  if (!isRecord(iconUrls)) {
    return '';
  }
  if (isEvolved && typeof iconUrls.evolutionMedium === 'string') {
    return iconUrls.evolutionMedium;
  }
  return typeof iconUrls.medium === 'string' ? iconUrls.medium : '';
}

function toCard(candidate: unknown): PlayerDeckCard | null {
  if (!isRecord(candidate)) {
    return null;
  }
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const isEvolved = toSafeCount(candidate.evolutionLevel) > 0;
  const offset = rarityOffset(candidate.rarity);
  return {
    name,
    iconUrl: toIconUrl(candidate.iconUrls, isEvolved),
    level: toSafeCount(candidate.level) + offset,
    maxLevel: toSafeCount(candidate.maxLevel) + offset,
    elixirCost: toSafeCount(candidate.elixirCost),
    isEvolved,
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
