/**
 * Configuration MSW pour Vitest (tests unitaires).
 * Utilise setupServer() qui intercepte les appels au niveau Node.js.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Serveur MSW pour les tests. */
export const mockServer = setupServer(...handlers);
