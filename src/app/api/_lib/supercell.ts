/**
 * Proxy vers l'API Supercell (US 1.5).
 *
 * La cle API vit uniquement cote serveur : elle est lue depuis
 * CLASH_ROYALE_API_TOKEN et n'apparait jamais dans une reponse.
 * Les erreurs amont sont mappees vers un format stable et type ;
 * le corps brut d'une erreur Supercell n'est jamais retransmis.
 */

import { InvalidClanTagError, toApiTagSegment } from '@/domain/clan/clan-tag';

export const SUPERCELL_API_BASE_URL = 'https://api.clashroyale.com/v1';

/** Delai maximal accorde a Supercell avant de repondre 504. */
const DEFAULT_TIMEOUT_MS = 10_000;

export type ProxyErrorCode =
  | 'INVALID_TAG'
  | 'MISSING_API_TOKEN'
  | 'CLAN_NOT_FOUND'
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
  MISSING_API_TOKEN: 500,
  CLAN_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  UPSTREAM_TIMEOUT: 504,
};

const ERROR_MESSAGES: Record<ProxyErrorCode, string> = {
  INVALID_TAG: 'Le tag de clan fourni est invalide.',
  MISSING_API_TOKEN: 'CLASH_ROYALE_API_TOKEN est absent de la configuration serveur.',
  CLAN_NOT_FOUND: 'Aucun clan ne correspond a ce tag.',
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
  /** Remplace le timeout par defaut (tests). */
  timeoutMs?: number;
}

export type ClanSubPath = '' | '/currentriverrace' | '/riverracelog';

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

  const apiToken = options.apiToken ?? process.env.CLASH_ROYALE_API_TOKEN;
  if (!apiToken) {
    return errorResponse('MISSING_API_TOKEN');
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SUPERCELL_API_BASE_URL}/clans/${tagSegment}${subPath}`, {
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

  if (upstream.status === 404) {
    return errorResponse('CLAN_NOT_FOUND');
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
