/**
 * Chargement cote serveur des ressources clan pour les Server Components
 * de `/dashboard`, `/historique` et `/rh` (US 13.2, Epique 13).
 *
 * Appelle directement `proxyClanResource`/`proxyClanSearch`
 * (`api/_lib/supercell.ts`) plutot que de refaire un aller-retour HTTP vers
 * les Route Handlers depuis le serveur : meme logique (token, timeout,
 * mapping d'erreurs Supercell), sans le coup de latence ni la resolution
 * d'URL absolue d'un auto-fetch server-to-server.
 */

import type { ClanSubPath } from '@/app/api/_lib/supercell';
import { proxyClanResource } from '@/app/api/_lib/supercell';
import { readApiErrorMessage } from '@/hooks/use-api-resource';

export type ServerResourceResult<T> =
  { status: 'success'; data: T } | { status: 'error'; message: string };

/** Relaye une ressource clan (`''`, `/currentriverrace` ou `/riverracelog`). */
export async function fetchClanResource<T>(
  tag: string,
  subPath: ClanSubPath,
): Promise<ServerResourceResult<T>> {
  const response = await proxyClanResource(tag, subPath);
  const payload: unknown = await response.json();
  if (!response.ok) {
    return { status: 'error', message: readApiErrorMessage(payload, response.status) };
  }
  return { status: 'success', data: payload as T };
}
