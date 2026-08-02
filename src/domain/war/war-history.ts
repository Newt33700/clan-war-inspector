/**
 * Moteur de calcul de l'historique des Guerres de Clan (US 4.2).
 *
 * Parse la reponse brute de /riverracelog et calcule, semaine par semaine,
 * le nombre de combats joues sur 16 par joueur. C'est la valeur centrale
 * du produit : le parsing est volontairement defensif (donnees manquantes,
 * aberrantes ou dupliquees) et entierement pur - aucune dependance reseau,
 * aucun import React.
 */

import { normalizeClanTag } from '../clan/clan-tag';
import { canonicalizePlayerTag } from '../clan/player-tag';
import { clampCount } from './clamp';

/** Nombre de combats possibles par semaine de guerre : 4 decks x 4 jours. */
export const BATTLES_PER_WAR_WEEK = 16;

export interface WeekParticipant {
  /** Tag joueur canonique (ex. `#PLAYER1`). */
  tag: string;
  name: string;
  /** Combats joues cette semaine, borne dans [0, 16]. */
  battlesPlayed: number;
}

export interface WarWeek {
  /** Identifiant stable de semaine (ex. `s107-w3`). */
  weekId: string;
  seasonId: number | null;
  sectionIndex: number | null;
  createdDate: string | null;
  participants: WeekParticipant[];
}

export interface PlayerAttendance {
  tag: string;
  /** Dernier nom connu (celui de la semaine la plus recente). */
  name: string;
  /**
   * Combats par semaine, aligne sur l'ordre des semaines fournies.
   * `null` = le joueur n'etait pas membre du clan cette semaine-la
   * (distinct de 0 = present mais aucun combat joue).
   */
  battlesByWeek: (number | null)[];
  totalBattles: number;
  weeksPresent: number;
  averagePerPresentWeek: number;
}

export interface ClanWarHistory {
  weeks: WarWeek[];
  players: PlayerAttendance[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

/**
 * Borne un decompte de combats hebdomadaires dans [0, 16].
 * Toute valeur manquante, non numerique ou aberrante retombe sur un
 * entier sur (une valeur infiniment grande est ecretee a 16).
 */
export function clampBattleCount(value: unknown): number {
  return clampCount(value, BATTLES_PER_WAR_WEEK);
}

/** Compare un tag de clan brut du log au tag cible deja normalise. */
function clanTagEquals(value: unknown, targetTag: string): boolean {
  try {
    return normalizeClanTag(value as string) === targetTag;
  } catch {
    return false;
  }
}

function extractItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return raw.items;
  }
  return [];
}

/** Trouve le standing du clan cible dans une semaine, `null` sinon. */
function findClanStanding(standings: unknown[], targetTag: string): UnknownRecord | null {
  for (const entry of standings) {
    if (!isRecord(entry)) {
      continue;
    }
    const clan = entry.clan;
    if (isRecord(clan) && clanTagEquals(clan.tag, targetTag)) {
      return entry;
    }
  }
  return null;
}

/** Prefere `decksUsed` (source officielle), tolere `wins` en secours. */
function pickBattleSource(participant: UnknownRecord): unknown {
  if (typeof participant.decksUsed === 'number') {
    return participant.decksUsed;
  }
  return participant.wins;
}

function parseParticipants(standing: UnknownRecord): WeekParticipant[] {
  const clan = standing.clan;
  let source: unknown[] = [];
  if (isRecord(clan) && Array.isArray(clan.participants)) {
    source = clan.participants;
  } else if (Array.isArray(standing.participants)) {
    source = standing.participants;
  }

  const byTag = new Map<string, WeekParticipant>();
  for (const candidate of source) {
    if (!isRecord(candidate)) {
      continue;
    }
    const tag = canonicalizePlayerTag(candidate.tag);
    if (tag === null) {
      continue;
    }
    const battlesPlayed = clampBattleCount(pickBattleSource(candidate));
    const name =
      typeof candidate.name === 'string' && candidate.name.length > 0
        ? candidate.name
        : tag;

    const existing = byTag.get(tag);
    if (existing === undefined) {
      byTag.set(tag, { tag, name, battlesPlayed });
    } else if (battlesPlayed > existing.battlesPlayed) {
      // Doublon de tag : on conserve le decompte le plus eleve pour ne
      // jamais sous-evaluer l'assiduite d'un joueur.
      existing.battlesPlayed = battlesPlayed;
    }
  }
  return [...byTag.values()];
}

function buildWeekId(item: UnknownRecord, index: number): string {
  if (typeof item.seasonId === 'number' && typeof item.sectionIndex === 'number') {
    return `s${item.seasonId}-w${item.sectionIndex}`;
  }
  if (typeof item.createdDate === 'string') {
    return item.createdDate;
  }
  return `week-${index}`;
}

/**
 * Parse le journal brut de /riverracelog pour le clan cible.
 *
 * Accepte la forme officielle `{ items: [...] }` ou un tableau direct.
 * Les semaines ou le clan cible est absent (ou malformees) sont ignorees.
 * L'ordre d'origine est conserve : la plus recente en premier.
 *
 * @throws {InvalidClanTagError} si `clanTag` n'est pas un tag valide.
 */
export function parseRiverRaceLog(raw: unknown, clanTag: string): WarWeek[] {
  const targetTag = normalizeClanTag(clanTag);
  const weeks: WarWeek[] = [];

  extractItems(raw).forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }
    const standings = Array.isArray(item.standings) ? item.standings : [];
    const standing = findClanStanding(standings, targetTag);
    if (standing === null) {
      return;
    }
    weeks.push({
      weekId: buildWeekId(item, index),
      seasonId: typeof item.seasonId === 'number' ? item.seasonId : null,
      sectionIndex: typeof item.sectionIndex === 'number' ? item.sectionIndex : null,
      createdDate: typeof item.createdDate === 'string' ? item.createdDate : null,
      participants: parseParticipants(standing),
    });
  });

  return weeks;
}

/**
 * Pivote les semaines en une vue par joueur.
 *
 * `battlesByWeek` est aligne sur l'ordre des semaines fournies ; `null`
 * marque une semaine ou le joueur n'apparaissait pas dans le clan.
 * Tri deterministe : nom puis tag (tie-break stable).
 */
export function computeAttendance(weeks: WarWeek[]): PlayerAttendance[] {
  const players = new Map<string, PlayerAttendance>();

  weeks.forEach((week, weekIndex) => {
    for (const participant of week.participants) {
      let player = players.get(participant.tag);
      if (player === undefined) {
        player = {
          tag: participant.tag,
          // Les semaines arrivent de la plus recente a la plus ancienne :
          // le premier nom rencontre est donc le plus recent.
          name: participant.name,
          battlesByWeek: new Array<number | null>(weeks.length).fill(null),
          totalBattles: 0,
          weeksPresent: 0,
          averagePerPresentWeek: 0,
        };
        players.set(participant.tag, player);
      }
      player.battlesByWeek[weekIndex] = participant.battlesPlayed;
      player.totalBattles += participant.battlesPlayed;
      player.weeksPresent += 1;
    }
  });

  const result = [...players.values()];
  for (const player of result) {
    player.averagePerPresentWeek = player.totalBattles / player.weeksPresent;
  }
  result.sort((a, b) => a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag));
  return result;
}

/** Enchaine parsing et pivot : l'entree unique du dashboard historique. */
export function buildClanWarHistory(raw: unknown, clanTag: string): ClanWarHistory {
  const weeks = parseRiverRaceLog(raw, clanTag);
  return { weeks, players: computeAttendance(weeks) };
}
