/**
 * "Hall of Fame" (US 8) : classement par fame de la derniere semaine
 * complete de guerre pour le clan cible. Fonction pure, parsing defensif
 * comme le reste du domaine (US 4.2, US 6.1) — independant de
 * `domain/war/war-history` : ce module extrait une donnee differente
 * (`fame`, classement d'une seule semaine) sans les semantiques
 * multi-semaines (fusion, alignement) propres a l'historique d'assiduite.
 */

import { normalizeClanTag } from './clan-tag';
import { canonicalizePlayerTag } from './player-tag';

export interface HallOfFameEntry {
  tag: string;
  name: string;
  fame: number;
}

const DEFAULT_TOP_N = 3;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
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

function clanTagEquals(value: unknown, targetTag: string): boolean {
  try {
    return normalizeClanTag(value as string) === targetTag;
  } catch {
    return false;
  }
}

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

function toSafeFame(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

function extractTopFame(standing: UnknownRecord, topN: number): HallOfFameEntry[] {
  const clan = standing.clan;
  const source =
    isRecord(clan) && Array.isArray(clan.participants) ? clan.participants : [];

  const byTag = new Map<string, HallOfFameEntry>();
  for (const candidate of source) {
    if (!isRecord(candidate)) {
      continue;
    }
    const tag = canonicalizePlayerTag(candidate.tag);
    if (tag === null) {
      continue;
    }
    const fame = toSafeFame(candidate.fame);
    const name =
      typeof candidate.name === 'string' && candidate.name.length > 0
        ? candidate.name
        : tag;

    const existing = byTag.get(tag);
    if (existing === undefined || fame > existing.fame) {
      // Doublon de tag : ne jamais sous-evaluer la performance du joueur.
      byTag.set(tag, { tag, name, fame });
    }
  }

  return [...byTag.values()]
    .sort(
      (a, b) =>
        b.fame - a.fame || a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag),
    )
    .slice(0, topN);
}

/**
 * Cherche la semaine la plus recente (le premier item du log) ou le clan
 * cible apparait, et en extrait le top N par fame decroissante.
 *
 * @throws {InvalidClanTagError} si `clanTag` est invalide.
 */
export function findWeeklyTopFame(
  raw: unknown,
  clanTag: string,
  topN: number = DEFAULT_TOP_N,
): HallOfFameEntry[] {
  const normalizedTag = normalizeClanTag(clanTag);
  const items = extractItems(raw);

  for (const item of items) {
    if (!isRecord(item)) {
      continue;
    }
    const standings = Array.isArray(item.standings) ? item.standings : [];
    const standing = findClanStanding(standings, normalizedTag);
    if (standing !== null) {
      return extractTopFame(standing, topN);
    }
  }
  return [];
}
