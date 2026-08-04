/**
 * Memoire de plusieurs clans recemment inspectes (retour utilisateur du
 * 2026-08-04 : "pouvoir memoriser [jusqu'a 10] clans... il y a des
 * doublons de noms de clan"). Cle sur le tag (unique, contrairement au
 * nom affiche en jeu) pour eviter toute ambiguite entre deux clans
 * portant le meme nom. Complete `clan-tag-storage.ts` (qui ne memorise
 * que le dernier tag actif) sans le remplacer.
 */

import { isValidClanTag, normalizeClanTag } from '@/domain/clan/clan-tag';

const STORAGE_KEY = 'clan-war-inspector:recent-clans';

/** Nombre maximal de clans memorises, du plus recent au plus ancien. */
export const MAX_RECENT_CLANS = 10;

export interface RecentClan {
  tag: string;
  /** Nom affiche en jeu au moment de la memorisation ; peut etre perime. */
  name: string;
}

function isRecentClan(value: unknown): value is RecentClan {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<RecentClan>).tag === 'string' &&
    typeof (value as Partial<RecentClan>).name === 'string' &&
    isValidClanTag((value as RecentClan).tag)
  );
}

/** Lit la liste memorisee (plus recent en premier), `[]` si absente/invalide. */
export function readRecentClans(): RecentClan[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isRecentClan).slice(0, MAX_RECENT_CLANS);
  } catch {
    return [];
  }
}

/**
 * Ajoute (ou remonte en tete si deja present) un clan a la liste des
 * clans recents, plafonnee a `MAX_RECENT_CLANS`. `name` est optionnel :
 * a defaut de nom connu (ex. tag saisi directement, avant chargement du
 * clan), le tag sert de repli d'affichage, remplace par le vrai nom des
 * qu'il est connu (ex. depuis `ClanHeader` une fois le clan charge).
 */
export function rememberRecentClan(tag: string, name?: string): void {
  if (!isValidClanTag(tag)) {
    return;
  }
  const normalized = normalizeClanTag(tag);
  const displayName = name !== undefined && name.trim().length > 0 ? name : normalized;

  try {
    const current = readRecentClans();
    const withoutCurrent = current.filter((clan) => clan.tag !== normalized);
    const next = [{ tag: normalized, name: displayName }, ...withoutCurrent].slice(
      0,
      MAX_RECENT_CLANS,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Navigation privee ou stockage plein : tant pis pour la memoire.
  }
}
