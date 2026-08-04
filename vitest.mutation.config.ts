/**
 * Configuration Vitest dediee au mutation testing (Stryker).
 *
 * Stryker rejoue, pour CHAQUE mutant, tous les tests qui couvrent la ligne
 * mutee. Avec la configuration commune, un mutant du domaine etait verifie par
 * ~16 tests, dont des rendus de composants React en jsdom : le cout dominant
 * n'etait pas l'assertion mais le setup (jsdom + MSW, ~400 ms) rejoue a chaque
 * execution de fichier de test.
 *
 * On appaire donc chaque perimetre de mutation avec le perimetre de tests qui
 * lui correspond, et avec l'environnement minimal dont il a besoin :
 *
 *   domain -> tests unitaires du domaine, environnement `node`, aucun setup
 *   api    -> tests des routes API, environnement `node` (MSW intercepte cote Node)
 *   hooks  -> tests des hooks React, environnement `jsdom` + setup complet
 *
 * Le perimetre est choisi via STRYKER_SCOPE, heritee par les runners que
 * Stryker lance en sous-processus. Sans valeur, on retombe sur l'ensemble des
 * tests (comportement de vitest.config.ts).
 */
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const SCOPES = {
  domain: {
    include: ['src/domain/**/*.test.ts'],
    environment: 'node',
    setupFiles: [],
  },
  api: {
    include: ['src/app/api/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  hooks: {
    include: ['src/hooks/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  all: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
} as const satisfies Record<
  string,
  { include: string[]; environment: string; setupFiles: string[] }
>;

const requested = process.env.STRYKER_SCOPE ?? 'all';
const scope = requested in SCOPES ? SCOPES[requested as keyof typeof SCOPES] : SCOPES.all;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: scope.environment,
    setupFiles: [...scope.setupFiles],
    css: false,
    include: [...scope.include],
  },
});
