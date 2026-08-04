# clan-war-inspector

Dashboard de gestion de clan **Clash Royale**. Il repond a une seule question, chaque
semaine : **qui a joue ses 16 combats de guerre, et qui ne les a pas joues ?**

Architecture serverless : Next.js App Router, un Route Handler en guise de proxy vers
l'API Supercell, aucune base de donnees.

## Prerequis

- Node.js **>= 22.12**
- Une cle API Supercell ([developer.clashroyale.com](https://developer.clashroyale.com))

## Demarrage

```bash
npm install
cp .env.example .env.local   # puis renseignez CLASH_ROYALE_API_TOKEN
npm run dev
```

L'application demarre sur http://localhost:3000.

> La cle API n'est jamais exposee au navigateur : elle est lue cote serveur par le
> Route Handler (US 1.5). Aucune variable secrete ne doit etre prefixee `NEXT_PUBLIC_`.

## Deploiement (Vercel) et restriction IP Supercell

L'API Supercell n'accepte une cle que depuis des **IP fixes declarees**.
Or Vercel sort avec des IP dynamiques : la cle est alors refusee (403 chez
Supercell, `API_KEY_REJECTED` cote proxy). La solution communautaire est le
proxy [RoyaleAPI](https://docs.royaleapi.com/proxy.html) :

1. Sur [developer.clashroyale.com](https://developer.clashroyale.com), creez
   une cle dont la restriction IP autorise **`45.79.218.79`** (IP fixe du
   proxy RoyaleAPI).
2. Dans les variables d'environnement Vercel, definissez :
   - `CLASH_ROYALE_API_TOKEN` = la cle creee a l'etape 1
   - `CLASH_ROYALE_API_BASE_URL` = `https://proxy.royaleapi.dev/v1`
3. Redeployez.

Le proxy RoyaleAPI relaie la requete vers Supercell depuis son IP fixe ;
votre token transite en en-tete `Authorization` comme avec l'API officielle.
En local avec une IP fixe, laissez `CLASH_ROYALE_API_BASE_URL` vide pour
appeler directement `https://api.clashroyale.com/v1`.

## Scripts

| Commande                | Role                                                  |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Serveur de developpement                              |
| `npm run build`         | Build de production                                   |
| `npm run lint`          | ESLint (config Next + regles projet)                  |
| `npm run format`        | Prettier en ecriture (`format:check` en verification) |
| `npm run typecheck`     | `tsc --noEmit`                                        |
| `npm test`              | Tests unitaires et d'integration (Vitest)             |
| `npm run test:watch`    | Vitest en mode watch                                  |
| `npm run test:coverage` | Tests + couverture, **echoue sous les seuils**        |
| `npm run test:mutation` | Mutation testing Stryker, **echoue sous 90 %**        |
| `npm run verify`        | Enchaine format, lint, types, couverture et mutation  |

Le mutation testing est pilote par `scripts/mutation.mjs`, qui decoupe le travail en
perimetres (`domain`, `api`, `hooks`). Chaque perimetre n'execute que les tests qui le
concernent, dans l'environnement minimal qui lui suffit (cf. `vitest.mutation.config.ts`) :
la logique metier pure tourne sous `node` sans jsdom ni MSW. `scripts/mutation-report.mjs`
fusionne ensuite les rapports et applique le seuil une seule fois, sur l'ensemble.

```bash
npm run test:mutation                                   # tous les perimetres
node scripts/mutation.mjs --scope domain                # un seul perimetre
node scripts/mutation.mjs --scope hooks --shard 2/2     # un shard, comme en CI
npm run test:mutation:verify                            # exhaustivite des perimetres
```

## Portes de qualite

Ces seuils ne sont pas indicatifs : les commandes sortent en erreur quand ils ne sont
pas atteints, et la CI (US 2.1) bloquera la merge request.

| Perimetre                                | Outil       | Seuil                    |
| ---------------------------------------- | ----------- | ------------------------ |
| Global                                   | Vitest + v8 | 80 % lignes / branches   |
| `src/domain/**`                          | Vitest + v8 | **100 %**                |
| `src/domain`, `src/app/api`, `src/hooks` | Stryker     | **90 %** de mutants tues |

Rapports generes : `coverage/index.html`, un `reports/mutation/<perimetre>.html` par
perimetre, et `reports/mutation/merged.json` (union des perimetres, sur laquelle le seuil
de 90 % est evalue).

En CI, les perimetres tournent dans des jobs paralleles, en parallele des controles
statiques, des tests et du build ; un job final fusionne les rapports et applique le
seuil. Le job `static` verifie aussi qu'aucun fichier a muter n'echappe aux perimetres :
un nouveau repertoire de code metier doit etre declare dans `scripts/mutation-scopes.mjs`
et dans `vitest.mutation.config.ts`, sinon la CI echoue.

## Structure

```
src/
  app/            # UI et routes Next.js (App Router)
    api/          # Route Handlers - proxy Supercell (US 1.5)
  domain/         # Logique metier pure : aucun import React, aucun fetch
    clan/         # Tags de clan (normalisation, validation)
    war/          # Moteur d'historique de guerre (US 4.2)
  hooks/          # Hooks React reutilisables
  mocks/          # Handlers MSW et fixtures (US 1.2)
```

La regle de dependance est a sens unique : `app/` peut importer `domain/`, jamais
l'inverse. C'est ce qui permet de tester le coeur du produit sans DOM, sans reseau,
et de le soumettre a Stryker sans faire exploser les temps d'execution.

## Etat d'avancement

Le detail des epiques et des criteres d'acceptation est dans [`backlog.md`](./backlog.md).

- [x] **US 1.1** Initialisation du projet
- [x] **US 1.3** Stack de tests unitaires et mutation
- [x] **US 1.2** Mocking MSW
- [x] **US 1.5** Proxy API securise
- [x] **US 2.1** Pipeline CI bloquante (GitHub Actions)
- [x] **US 4.2** Moteur de calcul de l'historique (100 % couverture, 98 % mutation)
- [x] **US 3.1 / 3.2** Dashboard membres avec tris robustes
- [x] **US 4.3 / 4.4** Historique d'assiduite et alertes visuelles
- [x] **US 4.1** Suivi en direct de la guerre en cours
- [x] **US 5.1** Vue de renvoi (0 don + combats < seuil configurable)
- [x] **Finition** Persistance du tag, colonne Moyenne, pages 404/erreur, favicon
- [ ] **US 1.4** Stack E2E Playwright (delegue a la passe testing)
- [ ] Passe testing dediee sur les modules recents (voir backlog.md)
- [x] **Epique 6** Audit UX du 2026-08-02 : US 6.1 a US 6.8 (voir backlog.md)

Le site est **fonctionnellement complet** : saisie (ou rappel) du tag ->
membres triables -> guerre en cours -> historique 16 combats avec alertes ->
vue de purge. Deploiement Vercel : renseigner `CLASH_ROYALE_API_TOKEN`
dans les variables d'environnement du projet.

## Convention de developpement

TDD : le test echoue d'abord, le code le fait passer, le refactoring vient ensuite.
Une US n'est terminee que lorsque `npm run verify` passe en local.
