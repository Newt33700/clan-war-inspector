# Backlog — clan-war-inspector

> Dashboard de gestion de clan **Clash Royale** en architecture "Serverless".
> Objectif produit : **traquer l'assiduité des joueurs aux Guerres de Clan (River Race)** sur les dernières semaines, en se basant sur les **16 combats hebdomadaires**.

---

## 1. Contraintes techniques

### Architecture

| Sujet     | Choix                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Framework | Next.js (**App Router**)                                                                                 |
| Langage   | TypeScript (strict)                                                                                      |
| Style     | Tailwind CSS — thème Clash Royale (**Bleu**, **Or**, **Rouge**)                                          |
| Backend   | **Route Handlers** faisant office de proxy vers l'API Supercell (la clé API ne fuite jamais côté client) |
| Données   | API Supercell : `/clans/{clanTag}`, `/clans/{clanTag}/currentriverrace`, `/clans/{clanTag}/riverracelog` |

### Qualité & tests

| Type                   | Outil                          | Seuil                                                                                                              |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Unitaire / Intégration | Vitest + React Testing Library | **≥ 80 %** de couverture globale                                                                                   |
| Mutation testing       | Stryker Mutator                | **≥ 90 %** de mutants tués, **strictement** sur la logique métier (calculs, parsers, hooks custom) et le proxy API |
| E2E                    | Playwright                     | Couverture des parcours utilisateurs critiques                                                                     |
| Mock réseau            | **MSW (obligatoire)**          | Interception de tous les appels Supercell en tests unitaires **et** E2E                                            |

Méthodologie : **TDD** (Red → Green → Refactor) fortement recommandé, en particulier sur l'Épique 4.

### Definition of Done (commune à toutes les US)

- [ ] Tests unitaires écrits **avant** le code (TDD) et passants
- [ ] Seuils de couverture et de mutation respectés (le build casse sinon)
- [ ] Aucune erreur ESLint / Prettier / `tsc --noEmit`
- [ ] Appels réseau moqués via MSW (aucun appel réel en test)
- [ ] Pipeline CI vert sur la Merge Request
- [ ] Pas de secret committé (`.env.local` ignoré, variables via l'environnement CI)

---

## 2. Épiques et User Stories

### ÉPIQUE 1 — Fondations techniques & architecture de test

#### US 1.1 (Tech) — Initialisation du projet

**En tant que** développeur, **je veux** initialiser le projet Next.js avec Tailwind, TypeScript, ESLint et Prettier **afin d'**avoir un socle sain.

Critères d'acceptation :

- Projet Next.js App Router + TypeScript strict qui démarre en local
- Tailwind configuré avec les tokens de couleurs du thème Clash Royale
- ESLint + Prettier configurés, scripts `lint`, `format`, `typecheck` disponibles
- Structure de dossiers posée : séparation nette `domain/` (logique métier pure) vs `app/` (UI + routes)

---

#### US 1.2 (Tech) — Configuration du mocking

**En tant que** développeur, **je veux** mettre en place MSW pour moquer les endpoints `/clans/{clanTag}` et `/riverracelog` **afin de** développer et tester sans dépendre de l'API réelle de Supercell.

Critères d'acceptation :

- Handlers MSW pour les endpoints clan, river race courante et river race log
- Fixtures réalistes versionnées (clan complet, semaine partielle, joueur absent, clan vide)
- MSW branché sur Node (Vitest) **et** sur les tests Playwright
- Possibilité de simuler les cas d'erreur (404, 429, 500) depuis un test

---

#### US 1.3 (Tech) — Stack de tests unitaires & mutation

**En tant que** développeur, **je veux** configurer Vitest (couverture > 80 %) et Stryker Mutator (seuil > 90 % ciblé sur le métier) **afin de** garantir la robustesse de la logique.

Critères d'acceptation :

- Vitest + RTL + `jsdom`, script `test`, `test:coverage`
- Seuils de couverture globaux à 80 % configurés en **échec bloquant**
- Stryker configuré avec un périmètre **restreint** au métier et au proxy, seuil `break` à 90 %
- Rapports de couverture et de mutation exportés en artefacts

---

#### US 1.4 (Tech) — Stack E2E

**En tant que** développeur, **je veux** installer et configurer Playwright **afin de** simuler la navigation de l'utilisateur sur le dashboard.

Critères d'acceptation :

- Playwright configuré avec démarrage automatique du serveur Next
- Un test de fumée qui charge le dashboard avec données mockées
- Exécution headless en CI, traces/screenshots conservés en cas d'échec

---

#### US 1.5 (Tech) — Proxy API sécurisé

**En tant que** système, **je veux** un Route Handler (protégé et testé unitairement) qui fait le pont vers l'API Supercell en masquant la clé secrète, **avec** gestion des erreurs.

Critères d'acceptation :

- La clé API vit uniquement côté serveur et n'apparaît jamais dans une réponse ou le bundle client
- Normalisation du tag de clan (`#` encodé, casse, caractères invalides rejetés)
- Mapping d'erreurs explicite : **404** (clan inconnu), **429** (rate limit), **500 / 503** (erreur amont), timeout
- Réponse d'erreur au format stable et typé, jamais l'erreur brute de Supercell
- Couvert unitairement, score de mutation ≥ 90 %

---

### ÉPIQUE 2 — Intégration continue (CI/CD)

#### US 2.1 (Tech) — Pipeline de validation

**En tant que** Tech Lead, **je veux** un pipeline (GitHub Actions ou GitLab CI) qui lance lint, tests unitaires, mutation testing et tests E2E à chaque Merge Request, **et qui échoue** si les seuils de 80 % / 90 % ne sont pas atteints.

Critères d'acceptation :

- Étapes : `install` → `lint + typecheck` → `test:coverage` → `stryker` → `e2e`
- Pipeline **bloquant** : seuils non atteints = MR non mergeable
- Cache des dépendances et des navigateurs Playwright
- Artefacts publiés : rapport de couverture, rapport Stryker, traces Playwright
- Secrets (clé API) injectés via le coffre du CI, jamais en clair

---

### ÉPIQUE 3 — Dashboard général du clan

#### US 3.1 — Affichage des membres

**En tant que** chef de clan, **je veux** voir la liste des membres actuels avec leurs rôles, niveaux et trophées.

Critères d'acceptation :

- Données récupérées via le proxy (mocké en test, réel en prod)
- Colonnes : pseudo, tag, rôle, niveau (roi), trophées, dons
- États gérés : chargement, erreur, clan vide
- Responsive, thème Clash Royale appliqué

---

#### US 3.2 — Tris robustes

**En tant que** chef de clan, **je veux** pouvoir trier cette liste de membres.

Critères d'acceptation :

- Tri asc/desc sur chaque colonne triable, indicateur visuel de la colonne active
- Tri des rôles selon leur **hiérarchie métier** (chef > adjoint > aîné > membre), pas alphabétique
- Fonction de tri **pure**, isolée du composant, gestion des ex-æquo déterministe (tie-break stable)
- ⚠️ Score de mutation Stryker **≥ 90 %** sur la logique de tri

---

### ÉPIQUE 4 — Le moteur de Guerre de Clan (River Race)

#### US 4.1 — Suivi en direct

**En tant que** chef de clan, **je veux** voir l'activité de la guerre en cours **afin de** savoir qui a joué ses 4 decks aujourd'hui.

Critères d'acceptation :

- Distinction claire jour d'entraînement / jour de bataille
- Par joueur : decks utilisés aujourd'hui (`x/4`) et cumul sur la semaine
- Mise en évidence des joueurs à 0 deck joué
- Membres inscrits à la guerre mais ayant quitté le clan identifiés comme tels

---

#### US 4.2 — Logique de calcul de l'historique ⭐ _cœur du produit_

**En tant que** développeur, **je veux** un service métier capable de parser l'historique des guerres (`/riverracelog`) et de calculer précisément **le nombre de combats sur 16 par semaine et par joueur**.

Critères d'acceptation :

- Fonctions **pures**, sans dépendance réseau ni framework
- Parsing robuste : `standings` → clan cible → `participants`, semaine par semaine
- Cas limites couverts et testés : joueur arrivé en cours de semaine, joueur parti, joueur absent d'une semaine, semaine incomplète, log vide, valeurs manquantes ou aberrantes (> 16), doublons de tag
- Types de sortie explicites (jamais de `any`)
- ⚠️ **Couverture 100 %** et score de mutation Stryker **maximal** exigés

---

#### US 4.3 — Affichage de l'historique

**En tant que** chef de clan, **je veux** visualiser les résultats du calcul de l'US 4.2 dans un tableau synthétique d'assiduité des semaines précédentes.

Critères d'acceptation :

- Tableau croisé : joueurs en lignes, semaines en colonnes, valeur `n/16`
- Colonne de synthèse (moyenne ou total sur la période)
- Distinction visuelle entre « 0 combat » et « non membre cette semaine-là »
- Tableau scrollable horizontalement sur mobile

---

#### US 4.4 — Alertes visuelles

**En tant que** chef de clan, **je veux** que les joueurs n'ayant pas fait leurs 16 combats soient mis en évidence **afin de** repérer les tire-au-flanc en un coup d'œil.

Critères d'acceptation :

- Code couleur par seuil (ex. 16 = vert/or, 12–15 = orange, < 12 = rouge)
- Jauge de progression par joueur et par semaine
- Fonction de classification **pure** et testée aux bornes exactes (11/12/15/16)
- Information non portée par la seule couleur (icône ou libellé) — accessibilité

---

### ÉPIQUE 5 — Purge et gestion du clan

#### US 5.1 — Vue de renvoi

**En tant que** chef de clan, **je veux** un filtre « À expulser » qui compile les données (0 don + moins de X combats en guerre) **afin de** n'afficher que les joueurs problématiques.

Critères d'acceptation :

- Seuil **X configurable** depuis l'interface
- Règle de combinaison des critères explicite et testée (ET / OU, bornes incluses ou non)
- Affichage du **motif** d'inclusion pour chaque joueur listé
- État vide explicite : « aucun joueur problématique »
- Logique de filtrage pure, score de mutation ≥ 90 %

---

## 3. Ordre de réalisation recommandé

1. **US 1.1** — socle du projet
2. **US 1.3** — outillage de test (indispensable pour faire du TDD dès la suite)
3. **US 1.2** — MSW et fixtures
4. **US 1.5** — proxy API sécurisé
5. **US 2.1** — CI bloquante (les seuils doivent mordre le plus tôt possible)
6. **US 4.2** — moteur de calcul, le cœur de valeur, développé en pur TDD
7. **US 3.1 / 3.2** — dashboard membres
8. **US 4.3 / 4.4** — restitution de l'historique et alertes
9. **US 1.4** — Playwright (peut être avancé si l'on veut de l'E2E dès le dashboard)
10. **US 4.1** — suivi en direct
11. **US 5.1** — vue de purge
