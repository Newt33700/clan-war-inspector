#!/usr/bin/env node
/**
 * Fusionne les rapports JSON produits par les shards de mutation et applique le
 * seuil global.
 *
 * Le decoupage repartit les fichiers a muter sur plusieurs jobs : le score d'un
 * shard pris isolement n'est pas celui du projet. On ne gate donc pas shard par
 * shard (un petit shard peut legitimement etre sous la moyenne), `break` est
 * neutralise dans stryker.config.json, et le seuil est evalue une seule fois,
 * ici, sur l'union des rapports.
 *
 * Usage : node scripts/mutation-report.mjs [dossier] [--threshold n]
 */
import { globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  ROOT,
  expectedFiles,
  threshold as configuredThreshold,
} from './mutation-scopes.mjs';

/** Statuts comptes au numerateur / denominateur du score de mutation. */
const DETECTED = new Set(['Killed', 'Timeout']);
const UNDETECTED = new Set(['Survived', 'NoCoverage']);

const argv = process.argv.slice(2);
const thresholdAt = argv.indexOf('--threshold');
const inputDir = resolve(
  ROOT,
  argv.find((arg) => !arg.startsWith('--')) ?? 'reports/mutation',
);
const threshold =
  thresholdAt === -1 ? configuredThreshold() : Number(argv[thresholdAt + 1]);

const jsonFiles = globSync('**/*.json', { cwd: inputDir }).map((file) =>
  file.split('\\').join('/'),
);
const manifests = jsonFiles.filter((file) => file.endsWith('.files.json')).sort();
const reports = jsonFiles
  .filter((file) => !file.endsWith('.files.json') && basename(file) !== 'merged.json')
  .sort();

if (reports.length === 0) {
  console.error(`Aucun rapport de mutation trouve dans ${inputDir}.`);
  process.exit(1);
}

/**
 * Garde-fou : sans lui, un shard perdu (job annule, artefact manquant) donnerait
 * un score calcule sur une partie du code seulement, et la CI passerait au vert.
 * Les manifestes disent quels fichiers chaque shard devait traiter.
 */
const planned = new Set(
  manifests.flatMap(
    (file) => JSON.parse(readFileSync(resolve(inputDir, file), 'utf8')).files,
  ),
);
const missing = expectedFiles().filter((file) => !planned.has(file));
if (missing.length > 0) {
  console.error(
    `Rapports incomplets : ${missing.length} fichier(s) a muter absent(s) des shards recuperes.\n` +
      missing.map((file) => `  - ${file}`).join('\n'),
  );
  process.exit(1);
}

const merged = {
  schemaVersion: '1.0',
  thresholds: { high: 95, low: threshold },
  files: {},
};
const counts = {};

for (const file of reports) {
  const report = JSON.parse(readFileSync(resolve(inputDir, file), 'utf8'));
  merged.schemaVersion = report.schemaVersion ?? merged.schemaVersion;
  for (const [mutatedFile, result] of Object.entries(report.files ?? {})) {
    if (merged.files[mutatedFile]) {
      console.error(
        `${mutatedFile} apparait dans plusieurs shards : les shards se recouvrent.`,
      );
      process.exit(1);
    }
    merged.files[mutatedFile] = result;
    for (const mutant of result.mutants ?? []) {
      counts[mutant.status] = (counts[mutant.status] ?? 0) + 1;
    }
  }
}

const sum = (statuses) =>
  Object.entries(counts).reduce(
    (acc, [status, n]) => acc + (statuses.has(status) ? n : 0),
    0,
  );
const detected = sum(DETECTED);
const valid = detected + sum(UNDETECTED);
const score = valid === 0 ? 100 : (detected / valid) * 100;
const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
const mutatedFiles = Object.keys(merged.files).length;

mkdirSync(inputDir, { recursive: true });
writeFileSync(resolve(inputDir, 'merged.json'), JSON.stringify(merged));

console.log(`Rapports fusionnes : ${reports.length}`);
console.log(`Fichiers mutes     : ${mutatedFiles}`);
console.log(`Mutants            : ${total}`);
for (const [status, n] of Object.entries(counts).sort())
  console.log(`  ${status} : ${n}`);
console.log(`Score de mutation  : ${score.toFixed(2)} % (seuil ${threshold} %)`);

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    '### Mutation testing\n\n' +
      '| Score | Seuil | Mutants | Fichiers |\n|---|---|---|---|\n' +
      `| **${score.toFixed(2)} %** | ${threshold} % | ${total} | ${mutatedFiles} |\n\n` +
      Object.entries(counts)
        .sort()
        .map(([status, n]) => `- ${status} : ${n}`)
        .join('\n') +
      '\n',
    { flag: 'a' },
  );
}

if (score < threshold) {
  console.error(
    `Score de mutation ${score.toFixed(2)} % sous le seuil de ${threshold} %.`,
  );
  process.exit(1);
}
