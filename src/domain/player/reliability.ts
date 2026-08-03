/**
 * Indice de fiabilite d'un nouveau membre (US 11, "Sas de Quarantaine") :
 * avant le debut de la guerre, on n'a aucun historique GDC chez nous pour
 * ces joueurs. On analyse donc leur profil global (`/players/{tag}`) pour
 * estimer le risque avant qu'ils ne participent.
 *
 * "Le Hack des Badges" : l'API Supercell n'expose aucun total propre des
 * victoires en Guerre de Clans a vie. Le plus proche est le `progress` du
 * badge `ClanWarWins` du tableau `badges[]` - une jauge de palier (bornee
 * par `target`), pas un cumul brut, mais c'est la seule donnee disponible.
 * Nom de badge verifie sur le clan reel #20J20QG le 2026-08-03 (`progress:
 * 96` pour un joueur de 9416 combats, cf. reliability.test.ts).
 */

import { toSafeCount } from '../shared/numeric';

export interface PlayerReliabilityStats {
  /** Combats totaux (toutes epreuves confondues) du joueur. */
  battleCount: number;
  /** Victoires GDC a vie, approximees via le badge `ClanWarWins`. */
  clanWarWins: number;
}

export type ReliabilityLevel = 'red' | 'orange' | 'green' | 'unknown';

/** Sous ce nombre de combats, aucun feu rouge ne doit se declencher. */
const RED_BATTLE_COUNT_THRESHOLD = 1000;
/** Sous ce nombre de victoires GDC, le joueur est suspect (feu rouge). */
const RED_MAX_CLAN_WAR_WINS = 0;
/** Sous ce nombre de combats, aucun feu orange ne doit se declencher. */
const ORANGE_BATTLE_COUNT_THRESHOLD = 3000;
/** Sous ce nombre de victoires GDC (mais au moins 1), feu orange. */
const ORANGE_MAX_CLAN_WAR_WINS = 30;
/** Au dela de ce nombre de victoires GDC, profil juge fiable. */
const GREEN_MIN_CLAN_WAR_WINS = 50;

const CLAN_WAR_WINS_BADGE_NAME = 'ClanWarWins';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractClanWarWins(raw: UnknownRecord): number {
  if (!Array.isArray(raw.badges)) {
    return 0;
  }
  for (const candidate of raw.badges) {
    if (isRecord(candidate) && candidate.name === CLAN_WAR_WINS_BADGE_NAME) {
      return toSafeCount(candidate.progress);
    }
  }
  return 0;
}

/**
 * Extrait les statistiques de fiabilite d'une reponse brute de
 * `/players/{tag}`. `null` si la reponse n'est meme pas exploitable.
 */
export function parsePlayerReliabilityStats(raw: unknown): PlayerReliabilityStats | null {
  if (!isRecord(raw)) {
    return null;
  }
  return {
    battleCount: toSafeCount(raw.battleCount),
    clanWarWins: extractClanWarWins(raw),
  };
}

/**
 * Calcule le feu rouge/orange/vert d'un nouveau membre.
 *
 * Priorite explicite : rouge d'abord (cas le plus grave), puis orange,
 * puis vert. Un joueur a 0 victoire et plus de 3000 combats remplit a la
 * fois la regle rouge et la regle orange : il reste rouge, jamais degrade
 * en orange. Aucune des trois regles ne matchant, le profil est `unknown`
 * (ni assez de recul negatif ni assez de recul positif pour trancher).
 */
export function computeReliabilityLevel(stats: PlayerReliabilityStats): ReliabilityLevel {
  const { clanWarWins, battleCount } = stats;
  if (clanWarWins === RED_MAX_CLAN_WAR_WINS && battleCount > RED_BATTLE_COUNT_THRESHOLD) {
    return 'red';
  }
  if (
    clanWarWins < ORANGE_MAX_CLAN_WAR_WINS &&
    battleCount > ORANGE_BATTLE_COUNT_THRESHOLD
  ) {
    return 'orange';
  }
  if (clanWarWins > GREEN_MIN_CLAN_WAR_WINS) {
    return 'green';
  }
  return 'unknown';
}

/** Libelles francais, jamais la seule couleur ne porte l'information. */
export const RELIABILITY_LABELS: Record<ReliabilityLevel, string> = {
  red: 'A risque',
  orange: 'A surveiller',
  green: 'Bon profil',
  unknown: 'Profil neutre',
};
