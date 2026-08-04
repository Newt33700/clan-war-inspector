/**
 * Definition des perimetres de mutation, partagee par scripts/mutation.mjs
 * (execution) et scripts/mutation-report.mjs (fusion et seuil).
 *
 * Un perimetre associe des fichiers de production a la configuration Vitest qui
 * sait les tester (cf. vitest.mutation.config.ts, meme jeu de cles).
 */
import { globSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const SCOPES = {
  domain: ['src/domain/**/*.ts'],
  api: ['src/app/api/**/*.ts'],
  hooks: ['src/hooks/**/*.ts'],
};

/** Fichiers exclus de la mutation quel que soit le perimetre. */
const EXCLUDE = /\.(test|spec)\.tsx?$|\.d\.ts$/;

/** Resout des patterns en liste de fichiers triee, dedupliquee, en chemins POSIX. */
export function resolveFiles(patterns) {
  const found = new Set();
  for (const pattern of patterns) {
    for (const match of globSync(pattern, { cwd: ROOT })) {
      const file = match.split('\\').join('/');
      if (!EXCLUDE.test(file)) found.add(file);
    }
  }
  return [...found].sort();
}

/**
 * Fichiers que la CI doit muter, d'apres le `mutate` de stryker.config.json.
 * C'est la reference : les perimetres ci-dessus doivent en couvrir l'integralite.
 */
export function expectedFiles() {
  const config = JSON.parse(readFileSync(resolve(ROOT, 'stryker.config.json'), 'utf8'));
  return resolveFiles(config.mutate.filter((pattern) => !pattern.startsWith('!')));
}

/** Seuil bloquant, lu depuis stryker.config.json pour n'avoir qu'une source de verite. */
export function threshold() {
  const config = JSON.parse(readFileSync(resolve(ROOT, 'stryker.config.json'), 'utf8'));
  return config.thresholds.low;
}
