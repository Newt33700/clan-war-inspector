/**
 * Résumé d'identité du clan (US 6.1) : parsing défensif de /clans/{tag}.
 *
 * Absent jusqu'ici du domaine, alors que `parseClanMembers` (US 3.1)
 * l'extrayait déjà de la même réponse : sans lui, rien à l'écran ne
 * confirme que le tag saisi correspond bien au clan attendu.
 */

export interface ClanSummary {
  tag: string;
  name: string;
  /** URL du badge, préférence medium > large > small, vide si absent. */
  badgeUrl: string;
  memberCount: number;
  clanScore: number;
  warTrophies: number;
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

function toBadgeUrl(badgeUrls: unknown): string {
  if (!isRecord(badgeUrls)) {
    return '';
  }
  for (const size of ['medium', 'large', 'small']) {
    const url = badgeUrls[size];
    if (typeof url === 'string' && url.length > 0) {
      return url;
    }
  }
  return '';
}

function toMemberCount(raw: UnknownRecord): number {
  const declared = raw.members;
  if (typeof declared === 'number' && Number.isFinite(declared) && declared >= 0) {
    return Math.trunc(declared);
  }
  return Array.isArray(raw.memberList) ? raw.memberList.length : 0;
}

/**
 * Extrait l'identité du clan d'une réponse brute de /clans/{tag}.
 * `null` si la réponse n'a même pas de tag exploitable.
 */
export function parseClanSummary(raw: unknown): ClanSummary | null {
  if (!isRecord(raw)) {
    return null;
  }
  const tag = raw.tag;
  if (typeof tag !== 'string' || tag.trim().length === 0) {
    return null;
  }

  const name = typeof raw.name === 'string' && raw.name.length > 0 ? raw.name : tag;

  return {
    tag,
    name,
    badgeUrl: toBadgeUrl(raw.badgeUrls),
    memberCount: toMemberCount(raw),
    clanScore: toSafeCount(raw.clanScore),
    warTrophies: toSafeCount(raw.clanWarTrophies),
  };
}
