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

## Portes de qualite

Ces seuils ne sont pas indicatifs : les commandes sortent en erreur quand ils ne sont
pas atteints, et la CI (US 2.1) bloquera la merge request.

| Perimetre                                | Outil       | Seuil                    |
| ---------------------------------------- | ----------- | ------------------------ |
| Global                                   | Vitest + v8 | 80 % lignes / branches   |
| `src/domain/**`                          | Vitest + v8 | **100 %**                |
| `src/domain`, `src/app/api`, `src/hooks` | Stryker     | **90 %** de mutants tues |

Rapports generes : `coverage/index.html` et `reports/mutation/index.html`.

## Structure

```
src/
  app/            # UI et routes Next.js (App Router)
    api/          # Route Handlers - proxy Supercell (US 1.5)
  domain/         # Logique metier pure : aucun import React, aucun fetch
    clan/         # Tags, membres, tris
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
- [ ] **US 1.4** Stack E2E Playwright
- [ ] Epiques 3 a 5

## Convention de developpement

TDD : le test echoue d'abord, le code le fait passer, le refactoring vient ensuite.
Une US n'est terminee que lorsque `npm run verify` passe en local.
