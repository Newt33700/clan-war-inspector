#!/usr/bin/env node
/**
 * Pilote le mutation testing Stryker.
 *
 * Deux leviers de performance sont implementes ici :
 *
 * 1. Appairage perimetre-mutate <-> perimetre-tests. Stryker rejoue, pour chaque
 *    mutant, tous les tests qui le couvrent : laisser les tests de composants
 *    React couvrir la logique metier faisait passer la moyenne a ~16 tests par
 *    mutant. En restreignant les tests du domaine aux tests unitaires du domaine
 *    (environnement `node`, sans setup jsdom/MSW), ce chiffre s'effondre.
 *
 * 2. Decoupage en shards (`--shard i/n`) pour repartir les fichiers a muter sur
 *    plusieurs jobs CI. La repartition est calculee a partir des fichiers
 *    reellement presents : ajouter un fichier ne demande aucune mise a jour de
 *    la CI.
 *
 * Usage :
 *   node scripts/mutation.mjs                      # tous les perimetres, en serie
 *   node scripts/mutation.mjs --scope domain
 *   node scripts/mutation.mjs --scope hooks --shard 2/2
 *   node scripts/mutation.mjs --verify             # exhaustivite des perimetres
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, SCOPES, expectedFiles, resolveFiles } from './mutation-scopes.mjs';

const REPORTS = resolve(ROOT, 'reports/mutation');

/**
 * Repartit les fichiers en `total` lots de poids equivalent (LPT : on place
 * toujours le plus gros fichier restant dans le lot le plus leger). Le poids
 * utilise est la taille du fichier, bon proxy du nombre de mutants.
 */
function shard(files, index, total) {
  if (total === 1) return files;
  const weighted = files
    .map((file) => ({ file, weight: statSync(resolve(ROOT, file)).size }))
    .sort((a, b) => b.weight - a.weight || a.file.localeCompare(b.file));
  const buckets = Array.from({ length: total }, () => ({ weight: 0, files: [] }));
  for (const { file, weight } of weighted) {
    const lightest = buckets.reduce((min, b) => (b.weight < min.weight ? b : min));
    lightest.files.push(file);
    lightest.weight += weight;
  }
  return buckets[index - 1].files.sort();
}

/**
 * Garde-fou : un fichier ajoute dans un repertoire absent de `SCOPES` ne serait
 * jamais mute, et la CI resterait verte en silence. On compare donc l'union des
 * perimetres au `mutate` de reference de stryker.config.json.
 */
function verify() {
  const expected = expectedFiles();
  const covered = new Set(resolveFiles(Object.values(SCOPES).flat()));
  const missing = expected.filter((file) => !covered.has(file));
  if (missing.length > 0) {
    console.error(
      'Fichiers a muter non couverts par les perimetres de scripts/mutation-scopes.mjs :\n' +
        missing.map((file) => `  - ${file}`).join('\n') +
        '\nAjoutez le repertoire concerne a SCOPES, et son perimetre de tests dans vitest.mutation.config.ts.',
    );
    process.exit(1);
  }
  console.log(`Perimetres OK : ${expected.length} fichier(s) a muter, tous couverts.`);
}

/** Lance Stryker sur un perimetre (eventuellement un shard de ce perimetre). */
function run(scope, index, total, extraArgs) {
  const files = shard(resolveFiles(SCOPES[scope]), index, total);
  if (files.length === 0) {
    console.error(
      `Aucun fichier a muter pour le perimetre "${scope}" (shard ${index}/${total}).`,
    );
    process.exit(1);
  }
  const suffix = total > 1 ? `${scope}-${index}` : scope;
  mkdirSync(REPORTS, { recursive: true });

  // Manifeste lu par la porte de qualite : il permet de verifier que l'union des
  // shards couvre bien tous les fichiers, meme si un job a ete perdu en route.
  writeFileSync(
    resolve(REPORTS, `${suffix}.files.json`),
    JSON.stringify({ scope, shard: `${index}/${total}`, files }, null, 2),
  );

  console.log(`\n=== Mutation ${suffix} : ${files.length} fichier(s) a muter ===`);
  const result = spawnSync(
    'npx',
    ['stryker', 'run', 'stryker.config.json', '--mutate', files.join(','), ...extraArgs],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, STRYKER_SCOPE: scope },
      shell: process.platform === 'win32',
    },
  );

  // Stryker n'expose pas le nom des rapports en ligne de commande : on renomme
  // pour que plusieurs perimetres puissent coexister dans reports/mutation.
  for (const [from, to] of [
    ['mutation.json', `${suffix}.json`],
    ['mutation.html', `${suffix}.html`],
  ]) {
    try {
      renameSync(resolve(REPORTS, from), resolve(REPORTS, to));
    } catch {
      // Rapport absent (echec avant generation) : rien a renommer.
    }
  }
  return result.status ?? 1;
}

const argv = process.argv.slice(2);
const readFlag = (name) => {
  const at = argv.indexOf(name);
  return at === -1 ? undefined : argv[at + 1];
};

if (argv.includes('--verify')) {
  verify();
  process.exit(0);
}

const scopeArg = readFlag('--scope');
const shardArg = readFlag('--shard') ?? '1/1';
const [index, total] = shardArg.split('/').map(Number);

if (!Number.isInteger(index) || !Number.isInteger(total) || index < 1 || index > total) {
  console.error(`--shard invalide : "${shardArg}" (attendu : i/n, 1 <= i <= n).`);
  process.exit(1);
}
if (scopeArg && !SCOPES[scopeArg]) {
  console.error(
    `Perimetre inconnu : "${scopeArg}" (attendu : ${Object.keys(SCOPES).join(', ')}).`,
  );
  process.exit(1);
}

// Les arguments non reconnus (ex. --incremental) sont transmis a Stryker.
const consumed = new Set(['--scope', scopeArg, '--shard', shardArg]);
const extraArgs = argv.filter((arg) => !consumed.has(arg));

// Repartir d'un dossier vide : un rapport d'un run precedent (autre decoupage,
// fichier supprime depuis) fausserait la fusion faite par mutation-report.mjs.
rmSync(REPORTS, { recursive: true, force: true });

let status = 0;
for (const scope of scopeArg ? [scopeArg] : Object.keys(SCOPES)) {
  status = run(scope, index, total, extraArgs) || status;
}
process.exit(status);
