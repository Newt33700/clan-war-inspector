/**
 * Combats recents d'un joueur (retour utilisateur 2026-08-04, inspiration
 * StatsRoyale "Combats recents") : parsing defensif de
 * /players/{tag}/battlelog. Fonction pure, sans dependance reseau.
 */

import { toSafeCount } from '../shared/numeric';

export type BattleResult = 'win' | 'loss' | 'draw';

export interface RecentBattle {
  result: BattleResult;
}

/** L'API retourne jusqu'a 25 combats ; on n'en affiche qu'un sous-ensemble lisible. */
const MAX_RECENT_BATTLES = 20;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toCrowns(participants: unknown): number {
  if (!Array.isArray(participants) || participants.length === 0) {
    return 0;
  }
  const first: unknown = participants[0];
  return isRecord(first) ? toSafeCount(first.crowns) : 0;
}

function toResult(entry: unknown): BattleResult | null {
  if (!isRecord(entry) || !Array.isArray(entry.team) || !Array.isArray(entry.opponent)) {
    return null;
  }
  const teamCrowns = toCrowns(entry.team);
  const opponentCrowns = toCrowns(entry.opponent);
  if (teamCrowns > opponentCrowns) {
    return 'win';
  }
  if (teamCrowns < opponentCrowns) {
    return 'loss';
  }
  return 'draw';
}

/**
 * Extrait les combats exploitables d'une reponse brute de
 * /players/{tag}/battlelog (tableau attendu, du plus recent au plus ancien).
 */
export function parseRecentBattles(raw: unknown): RecentBattle[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .slice(0, MAX_RECENT_BATTLES)
    .map(toResult)
    .filter((result): result is BattleResult => result !== null)
    .map((result) => ({ result }));
}
