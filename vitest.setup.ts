import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { mockServer } from './src/mocks/server';
import { resetMockResponses } from './src/mocks/handlers';

// Démarre le serveur MSW avant tous les tests
beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: 'error' });
});

// Réinitialise les mocks après chaque test
afterEach(() => {
  mockServer.resetHandlers();
  resetMockResponses();
  cleanup();
});

// Arrête le serveur MSW après tous les tests
afterAll(() => {
  mockServer.close();
});
