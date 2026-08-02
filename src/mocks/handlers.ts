/**
 * Handlers MSW pour intercepter les appels à l'API Supercell.
 * À utiliser avec setupServer() en Vitest et avec startServer() en E2E.
 */

import { http, HttpResponse } from 'msw';
import type { ClanInfo, RiverRace, RiverRaceLog } from './types';

type StubResolver =
  ClanInfo | RiverRace | RiverRaceLog | { error: string } | null | undefined;

/**
 * Stockage des réponses mockées.
 * Permet à chaque test de configurer les réponses souhaitées.
 */
const mockResponses: Record<string, StubResolver> = {
  clan: null,
  currentRiverRace: null,
  riverRaceLog: null,
};

/** Récupère la réponse mockée pour un endpoint. */
export function getMockResponse(key: string): StubResolver {
  return mockResponses[key];
}

/** Définit la réponse mockée pour un endpoint. */
export function setMockResponse(key: string, response: StubResolver): void {
  mockResponses[key] = response;
}

/** Réinitialise toutes les réponses mockées. */
export function resetMockResponses(): void {
  mockResponses.clan = null;
  mockResponses.currentRiverRace = null;
  mockResponses.riverRaceLog = null;
}

/** Handlers MSW pour l'API Supercell. */
export const handlers = [
  /**
   * GET /api/clans/{clanTag}
   * Récupère les informations du clan.
   */
  http.get('*/api/clans/:clanTag', () => {
    const response = getMockResponse('clan');

    if (response === null) {
      return new HttpResponse(JSON.stringify({ reason: 'notFound' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (typeof response === 'object' && 'error' in response) {
      return new HttpResponse(JSON.stringify(response), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return HttpResponse.json(response);
  }),

  /**
   * GET /api/clans/{clanTag}/currentriverrace
   * Récupère l'état actuel de la guerre.
   */
  http.get('*/api/clans/:clanTag/currentriverrace', () => {
    const response = getMockResponse('currentRiverRace');

    if (response === null) {
      return new HttpResponse(JSON.stringify({ reason: 'notFound' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (typeof response === 'object' && 'error' in response) {
      return new HttpResponse(JSON.stringify(response), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return HttpResponse.json(response);
  }),

  /**
   * GET /api/clans/{clanTag}/riverracelog
   * Récupère l'historique des guerres.
   */
  http.get('*/api/clans/:clanTag/riverracelog', () => {
    const response = getMockResponse('riverRaceLog');

    if (response === null) {
      return new HttpResponse(JSON.stringify({ reason: 'notFound' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (typeof response === 'object' && 'error' in response) {
      return new HttpResponse(JSON.stringify(response), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return HttpResponse.json(response);
  }),
];
