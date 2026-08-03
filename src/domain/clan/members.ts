/**
 * Membres du clan : parsing defensif de /clans/{tag} (US 3.1) et
 * logique de tri pure (US 3.2, score de mutation >= 90 % exige).
 */

import { toSafeCount } from '../shared/numeric';
import { canonicalizePlayerTag } from './player-tag';

export type ClanRole = 'leader' | 'coLeader' | 'elder' | 'member';

export interface ClanMember {
  tag: string;
  name: string;
  role: ClanRole;
  trophies: number;
  donations: number;
}

/**
 * Hierarchie metier des roles : chef > adjoint > aine > membre.
 * Le tri par role s'appuie sur ce rang, jamais sur l'ordre alphabetique.
 */
export const ROLE_RANK: Record<ClanRole, number> = {
  leader: 3,
  coLeader: 2,
  elder: 1,
  member: 0,
};

/** Libelles francais des roles pour l'affichage. */
export const ROLE_LABELS: Record<ClanRole, string> = {
  leader: 'Chef',
  coLeader: 'Adjoint',
  elder: 'Aine',
  member: 'Membre',
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toRole(value: unknown): ClanRole {
  if (
    value === 'leader' ||
    value === 'coLeader' ||
    value === 'elder' ||
    value === 'member'
  ) {
    return value;
  }
  return 'member';
}

/**
 * Extrait la liste des membres d'une reponse brute de /clans/{tag}.
 * Les entrees inutilisables (sans tag) sont ignorees, les valeurs
 * numeriques manquantes retombent a 0, un role inconnu devient `member`.
 */
export function parseClanMembers(raw: unknown): ClanMember[] {
  if (!isRecord(raw) || !Array.isArray(raw.memberList)) {
    return [];
  }

  const members: ClanMember[] = [];
  for (const candidate of raw.memberList) {
    if (!isRecord(candidate)) {
      continue;
    }
    const tag = canonicalizePlayerTag(candidate.tag);
    if (tag === null) {
      continue;
    }
    const name =
      typeof candidate.name === 'string' && candidate.name.length > 0
        ? candidate.name
        : tag;
    members.push({
      tag,
      name,
      role: toRole(candidate.role),
      trophies: toSafeCount(candidate.trophies),
      donations: toSafeCount(candidate.donations),
    });
  }
  return members;
}

export type MemberSortKey = 'name' | 'role' | 'trophies' | 'donations';

export type SortDirection = 'asc' | 'desc';

function compareByKey(a: ClanMember, b: ClanMember, key: MemberSortKey): number {
  if (key === 'name') {
    return a.name.localeCompare(b.name);
  }
  if (key === 'role') {
    return ROLE_RANK[a.role] - ROLE_RANK[b.role];
  }
  return a[key] - b[key];
}

/**
 * Trie les membres sans muter l'entree (US 3.2).
 *
 * - `role` suit la hierarchie metier (chef > adjoint > aine > membre) ;
 * - les ex-aequo sont departages de facon deterministe par nom puis tag,
 *   toujours en ordre ascendant quelle que soit la direction demandee.
 */
export function sortMembers(
  members: readonly ClanMember[],
  key: MemberSortKey,
  direction: SortDirection,
): ClanMember[] {
  return [...members].sort((a, b) => {
    const comparison = compareByKey(a, b, key);
    const primary = direction === 'asc' ? comparison : -comparison;
    if (primary !== 0) {
      return primary;
    }
    return a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag);
  });
}

/**
 * Filtre les membres par pseudo ou tag (audit UX du 2026-08-02, US-8) :
 * retrouver un joueur precis dans une liste de 47+ lignes n'etait
 * possible qu'a l'oeil. Recherche insensible a la casse, sous-chaine.
 *
 * Pas de cas particulier pour une requete vide ou blanche : `.includes('')`
 * vaut toujours vrai, donc le filtre laisse deja passer tout le monde sans
 * branche dediee (un premier essai avec un retour anticipe s'est revele
 * un mutant Stryker equivalent pour cette meme raison).
 */
export function filterMembersByQuery(
  members: readonly ClanMember[],
  query: string,
): ClanMember[] {
  const trimmed = query.trim().toLowerCase();
  return members.filter(
    (member) =>
      member.name.toLowerCase().includes(trimmed) ||
      member.tag.toLowerCase().includes(trimmed),
  );
}
