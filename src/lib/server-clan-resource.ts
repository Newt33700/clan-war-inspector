/**
 * Chargement cote serveur des ressources clan pour les Server Components
 * de `/dashboard`, `/historique` et `/rh` (US 13.2, Epique 13).
 *
 * Appelle directement `proxyClanResource`/`proxyClanSearch`
 * (`api/_lib/supercell.ts`) plutot que de refaire un aller-retour HTTP vers
 * les Route Handlers depuis le serveur : meme logique (token, timeout,
 * mapping d'erreurs Supercell), sans le coup de latence ni la resolution
 * d'URL absolue d'un auto-fetch server-to-server.
 *
 * Cache en memoire, 10 min, cle tag+sous-ressource (US 15.1) : naviguer
 * entre Dashboard, Historique et RH pour le meme clan redemandait jusqu'a
 * 3 fois les memes donnees a Supercell (les 3 pages partagent `clan`, 2
 * sur 3 partagent `currentriverrace`/`riverracelog`). Cache par instance
 * serveur (pas partage entre instances Vercel froides) : le gain vaut
 * pour une instance qui reste chaude entre deux clics, cas normal d'une
 * session active. N'entrepose que les succes : une erreur (rate limit,
 * timeout Supercell...) ne doit jamais rester collee 10 min, l'utilisateur
 * doit pouvoir reessayer immediatement via "Reessayer"/"Actualiser" (qui
 * passent par le Route Handler cote client, hors de ce cache).
 */

import type { ClanSubPath } from '@/app/api/_lib/supercell';
import { proxyClanResource } from '@/app/api/_lib/supercell';
import { readApiErrorMessage } from '@/hooks/use-api-resource';

export type ServerResourceResult<T> =
  { status: 'success'; data: T } | { status: 'error'; message: string };

const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  result: ServerResourceResult<unknown>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(tag: string, subPath: ClanSubPath): string {
  return `${tag}${subPath}`;
}

/** Relaye une ressource clan (`''`, `/currentriverrace` ou `/riverracelog`). */
export async function fetchClanResource<T>(
  tag: string,
  subPath: ClanSubPath,
): Promise<ServerResourceResult<T>> {
  const key = cacheKey(tag, subPath);
  const cached = cache.get(key);
  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.result as ServerResourceResult<T>;
  }

  const response = await proxyClanResource(tag, subPath);
  const payload: unknown = await response.json();
  const result: ServerResourceResult<T> = !response.ok
    ? { status: 'error', message: readApiErrorMessage(payload, response.status) }
    : { status: 'success', data: payload as T };

  if (result.status === 'success') {
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return result;
}

/** Reservee aux tests : evite qu'une entree posee par un test n'en pollue un autre. */
export function clearClanResourceCache(): void {
  cache.clear();
}
