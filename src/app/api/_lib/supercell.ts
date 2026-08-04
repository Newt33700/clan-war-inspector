/**
 * Proxy vers l'API Supercell (US 1.5).
 *
 * La cle API vit uniquement cote serveur : elle est lue depuis
 * CLASH_ROYALE_API_TOKEN et n'apparait jamais dans une reponse.
 * Les erreurs amont sont mappees vers un format stable et type ;
 * le corps brut d'une erreur Supercell n'est jamais retransmis.
 *
 * URL de base configurable via CLASH_ROYALE_API_BASE_URL : indispensable
 * en hebergement a IP dynamique (Vercel), ou l'on passe par le proxy
 * communautaire RoyaleAPI (https://proxy.royaleapi.dev/v1) dont l'IP fixe
 * est declaree dans la cle Supercell.
 */

import { InvalidClanTagError, toApiTagSegment } from '@/domain/clan/clan-tag';
import { isSearchableClanName, MIN_SEARCH_NAME_LENGTH } from '@/domain/clan/clan-search';
import { toApiPlayerTagSegment } from '@/domain/clan/player-tag';

/** URL officielle Supercell, utilisee par defaut. */
export const SUPERCELL_API_BASE_URL = 'https://api.clashroyale.com/v1';

/** Resout l'URL de base effective (env > defaut), sans slash final. */
function resolveBaseUrl(override?: string): string {
  const base =
    override ?? process.env.CLASH_ROYALE_API_BASE_URL ?? SUPERCELL_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

/** Delai maximal accorde a Supercell avant de repondre 504. */
const DEFAULT_TIMEOUT_MS = 10_000;

export type ProxyErrorCode =
  | 'INVALID_TAG'
  | 'INVALID_SEARCH_QUERY'
  | 'MISSING_API_TOKEN'
  | 'API_KEY_REJECTED'
  | 'CLAN_NOT_FOUND'
  | 'PLAYER_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT';

/** Forme unique de toute reponse d'erreur du proxy. */
export interface ProxyErrorBody {
  error: {
    code: ProxyErrorCode;
    message: string;
  };
}

const ERROR_STATUS: Record<ProxyErrorCode, number> = {
  INVALID_TAG: 400,
  INVALID_SEARCH_QUERY: 400,
  MISSING_API_TOKEN: 500,
  API_KEY_REJECTED: 502,
  CLAN_NOT_FOUND: 404,
  PLAYER_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  UPSTREAM_TIMEOUT: 504,
};

const ERROR_MESSAGES: Record<ProxyErrorCode, string> = {
  INVALID_TAG: 'Le tag de clan fourni est invalide.',
  INVALID_SEARCH_QUERY: `Un nom de clan compte au moins ${MIN_SEARCH_NAME_LENGTH} caracteres.`,
  MISSING_API_TOKEN: 'CLASH_ROYALE_API_TOKEN est absent de la configuration serveur.',
  API_KEY_REJECTED:
    'Cle API refusee par Supercell (restriction IP). Sur un hebergeur a IP ' +
    'dynamique, creez une cle autorisant l IP 45.79.218.79 et definissez ' +
    'CLASH_ROYALE_API_BASE_URL=https://proxy.royaleapi.dev/v1.',
  CLAN_NOT_FOUND: 'Aucun clan ne correspond a ce tag.',
  PLAYER_NOT_FOUND: 'Aucun joueur ne correspond a ce tag.',
  RATE_LIMITED: 'Limite de requetes Supercell atteinte, reessayez plus tard.',
  UPSTREAM_ERROR: "L'API Supercell a repondu avec une erreur.",
  UPSTREAM_TIMEOUT: "L'API Supercell est injoignable ou trop lente.",
};

function errorResponse(
  code: ProxyErrorCode,
  message: string = ERROR_MESSAGES[code],
): Response {
  const body: ProxyErrorBody = { error: { code, message } };
  return Response.json(body, { status: ERROR_STATUS[code] });
}

export interface ProxyOptions {
  /** Remplace le token lu dans l'environnement (tests). */
  apiToken?: string;
  /** Remplace l'URL de base lue dans l'environnement (tests). */
  baseUrl?: string;
  /** Remplace le timeout par defaut (tests). */
  timeoutMs?: number;
}

export type ClanSubPath = '' | '/currentriverrace' | '/riverracelog';

/**
 * Relaye un chemin de ressource Supercell deja construit (clan ou joueur).
 * Coeur commun aux deux proxies : token, timeout, mapping d'erreurs.
 */
async function relaySupercellPath(
  path: string,
  options: ProxyOptions,
  notFoundCode: 'CLAN_NOT_FOUND' | 'PLAYER_NOT_FOUND',
): Promise<Response> {
  const apiToken = options.apiToken ?? process.env.CLASH_ROYALE_API_TOKEN;
  if (!apiToken) {
    return errorResponse('MISSING_API_TOKEN');
  }

  const baseUrl = resolveBaseUrl(options.baseUrl);

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    // Timeout ou panne reseau : Supercell est injoignable.
    return errorResponse('UPSTREAM_TIMEOUT');
  }

  // 401/403 : cle invalide ou IP non autorisee (cas classique sur Vercel).
  if (upstream.status === 401 || upstream.status === 403) {
    return errorResponse('API_KEY_REJECTED');
  }
  if (upstream.status === 404) {
    return errorResponse(notFoundCode);
  }
  if (upstream.status === 429) {
    return errorResponse('RATE_LIMITED');
  }
  if (!upstream.ok) {
    return errorResponse('UPSTREAM_ERROR');
  }

  const data: unknown = await upstream.json();
  return Response.json(data);
}

/**
 * Relaye une ressource clan de l'API Supercell.
 *
 * Le tag est normalise avant l'appel (US 1.5 s'appuie sur le module
 * domain/clan) : un tag invalide est rejete en 400 sans appel reseau.
 */
export async function proxyClanResource(
  rawTag: string,
  subPath: ClanSubPath,
  options: ProxyOptions = {},
): Promise<Response> {
  let tagSegment: string;
  try {
    tagSegment = toApiTagSegment(rawTag);
  } catch (error) {
    if (error instanceof InvalidClanTagError) {
      return errorResponse('INVALID_TAG', error.message);
    }
    throw error;
  }

  return relaySupercellPath(`/clans/${tagSegment}${subPath}`, options, 'CLAN_NOT_FOUND');
}

/**
 * Relaye le profil d'un joueur de l'API Supercell (US 9, inspection a la
 * demande). Meme contrat d'erreurs que `proxyClanResource`.
 */
export async function proxyPlayerResource(
  rawTag: string,
  options: ProxyOptions = {},
): Promise<Response> {
  const tagSegment = toApiPlayerTagSegment(rawTag);
  if (tagSegment === null) {
    return errorResponse('INVALID_TAG', `Tag joueur invalide : "${rawTag}".`);
  }

  return relaySupercellPath(`/players/${tagSegment}`, options, 'PLAYER_NOT_FOUND');
}

/**
 * Relaye les combats recents d'un joueur (retour utilisateur 2026-08-04,
 * inspiration StatsRoyale "Combats recents"). Meme contrat d'erreurs que
 * `proxyPlayerResource`.
 */
export async function proxyPlayerBattlelog(
  rawTag: string,
  options: ProxyOptions = {},
): Promise<Response> {
  const tagSegment = toApiPlayerTagSegment(rawTag);
  if (tagSegment === null) {
    return errorResponse('INVALID_TAG', `Tag joueur invalide : "${rawTag}".`);
  }

  return relaySupercellPath(
    `/players/${tagSegment}/battlelog`,
    options,
    'PLAYER_NOT_FOUND',
  );
}

/**
 * Relaye une recherche de clan par nom de l'API Supercell (US 10.1) :
 * la zone de saisie du dashboard accepte desormais un tag ou un nom.
 * Une requete trop courte est rejetee sans appel reseau (l'API Supercell
 * l'aurait refusee de toute facon).
 */
export async function proxyClanSearch(
  rawName: string,
  options: ProxyOptions = {},
): Promise<Response> {
  const trimmedName = rawName.trim();
  if (!isSearchableClanName(trimmedName)) {
    return errorResponse('INVALID_SEARCH_QUERY');
  }

  return relaySupercellPath(
    `/clans?name=${encodeURIComponent(trimmedName)}`,
    options,
    'CLAN_NOT_FOUND',
  );
}
