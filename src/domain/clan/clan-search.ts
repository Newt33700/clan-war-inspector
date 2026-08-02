/**
 * Recherche de clan par nom (US 10.1) : parsing defensif de la reponse
 * `/clans?name=...` de l'API Supercell. Chaque element du tableau `items`
 * a la meme forme qu'une reponse `/clans/{tag}` (tag, name, badgeUrls,
 * members, clanScore, clanWarTrophies) : `parseClanSummary` est
 * directement reutilisable, sans dupliquer son parsing.
 */

import { parseClanSummary, type ClanSummary } from './clan-summary';

/** Longueur minimale exigee par l'API Supercell pour une recherche par nom. */
export const MIN_SEARCH_NAME_LENGTH = 3;

/**
 * Vrai si la requete est assez longue pour declencher un appel reseau
 * (evite un appel voue a l'echec pendant que l'utilisateur tape encore).
 */
export function isSearchableClanName(query: string): boolean {
  return query.trim().length >= MIN_SEARCH_NAME_LENGTH;
}

type UnknownRecord = Record<string, unknown>;

// `typeof value === 'object'` est un mutant Stryker equivalent ici : une
// entree non-objet (ex. une chaine) n'a de toute facon pas de `.tag`
// exploitable, donc `parseClanSummary` la rejette identiquement avec ou
// sans ce garde (meme pattern que `isRecord` dans `members.ts`).
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

/**
 * Extrait la liste des clans candidats d'une reponse brute de
 * `/clans?name=...`. Accepte la forme officielle `{ items: [...] }` ;
 * une reponse inexploitable ou une entree sans tag exploitable ne fait
 * pas planter la recherche, elle est simplement ignoree.
 */
export function parseClanSearchResults(raw: unknown): ClanSummary[] {
  if (!isRecord(raw) || !Array.isArray(raw.items)) {
    return [];
  }
  const results: ClanSummary[] = [];
  for (const item of raw.items) {
    const summary = parseClanSummary(item);
    if (summary !== null) {
      results.push(summary);
    }
  }
  return results;
}
