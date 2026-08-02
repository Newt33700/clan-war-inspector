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

### ÉPIQUE 6 — Ergonomie et confiance produit (audit UX du 2026-08-02)

> Issu d'une revue UX du produit en production (clan testé : `#20J20QG`), menée
> par relecture exhaustive du code (accès direct au site en production non
> disponible depuis l'environnement d'audit). Priorités : **P0** bloque la
> confiance dans l'outil, **P1** freine l'usage courant, **P2** finitions.

#### US 6.1 (P0) — En-tête d'identité du clan

**En tant que** chef de clan, **je veux** voir le nom, le badge, le niveau et
l'effectif du clan chargé **afin de** confirmer visuellement que j'inspecte
le bon clan avant de prendre des décisions (expulsion, etc.).

Critères d'acceptation :

- Nouvelle fonction pure de parsing (`parseClanSummary` ou extension de
  `domain/clan/members`) exposant nom, tag, badge, niveau/score du clan et
  effectif courant / 50, testée unitairement
- Affiché en en-tête du dashboard dès `clanState.status === 'success'`,
  au-dessus du tableau des membres
- `<title>` de la page mis à jour avec le nom du clan (utile en multi-onglets)
- Aucune donnée affichée tant que le clan n'est pas chargé avec succès

---

#### US 6.2 (P0) — Lien partageable et navigation par URL

**En tant que** chef de clan, **je veux** que le tag inspecté soit reflété
dans l'URL (`?clan=%23TAG`) **afin de** partager un lien direct avec mes
co-chefs et réutiliser le bouton retour du navigateur.

Critères d'acceptation :

- Au chargement, un paramètre `clan` valide dans l'URL prime sur le tag
  mémorisé en `localStorage` (US finition existante, non régressée)
- La soumission du formulaire met à jour l'URL sans recharger la page
- Un lien copié/collé recharge directement le bon clan sans ressaisie
- Testé (composant ou hook dédié), y compris le cas d'un tag invalide en URL

---

#### US 6.3 (P1) — Reprise après erreur, section par section

**En tant que** chef de clan, **je veux** un bouton « Réessayer » sur chaque
section en erreur (membres, guerre en cours, historique) **afin de** relancer
uniquement la ressource en échec sans perdre ma saisie ni re-soumettre tout
le formulaire.

Critères d'acceptation :

- Bouton visible quand `status === 'error'` sur chacune des 3 ressources
  pilotées par `useApiResource`
- Le clic ne relance que la ressource concernée (pas de refetch global)
- Message d'erreur contextualisé conservé si le nouvel essai échoue à nouveau
- Testé : succès après échec, puis échec persistant

---

#### US 6.4 (P1) — Fraîcheur des données de la guerre en cours

**En tant que** chef de clan, **je veux** connaître l'heure de dernière mise
à jour de la guerre en cours et pouvoir l'actualiser sans recharger toute la
page **afin de** savoir si je regarde des decks joués il y a 5 minutes ou 2
heures.

Critères d'acceptation :

- Horodatage « Mise à jour à HH:MM » affiché dans la section Guerre en cours
- Bouton « Actualiser » qui ne relance que `/currentriverrace`
- Formatage de l'heure isolé en fonction pure, testée unitairement
- Aucune perte du tag saisi ni du tri des membres lors de l'actualisation

---

#### US 6.5 (P1) — Validation de saisie non intrusive du tag de clan

**En tant qu'**utilisateur, **je veux** que le message d'erreur de format du
tag n'apparaisse qu'une fois ma saisie stabilisée (jamais à chaque caractère
tapé), avec un exemple de tag réaliste, **afin de** ne pas être averti d'une
erreur avant d'avoir fini de taper.

Critères d'acceptation :

- Le message d'erreur de format est différé (debounce ou évaluation au
  `blur`), jamais affiché pendant une frappe continue
- Placeholder remplacé par un exemple de longueur réaliste (ex. `#20J20QG`)
  et texte d'aide « Où trouver mon tag de clan ? »
- Comportement testé (RTL + fake timers si debounce)

---

#### US 6.6 (P1) — Combinateur de règle et export de la vue « À expulser »

**En tant que** chef de clan, **je veux** choisir si les critères « 0 don »
et « combats insuffisants » se combinent en ET ou en OU, et copier la liste
des joueurs concernés, **afin d'**adapter la règle à ma politique de clan et
de la partager sur Discord sans recopier à la main.

Critères d'acceptation :

- Sélecteur ET / OU relié au paramètre `combinator` déjà supporté par
  `findPurgeCandidates` (actuellement câblé en dur sur `AND` dans
  `PurgeSection`)
- Bouton « Copier la liste » qui sérialise nom, tag et motif de chaque
  candidat vers le presse-papiers, avec confirmation visuelle
- Rappel du seuil de référence (16 combats attendus) à côté du champ de seuil
- Testé : changement de combinateur recalcule la liste, copie testée via un
  mock du presse-papiers

---

#### US 6.7 (P2) — Repères de lecture sur l'historique

**En tant que** chef de clan, **je veux** trier le tableau d'historique par
Total ou Moyenne et voir clairement qu'il reste du contenu à faire défiler
horizontalement sur mobile **afin de** repérer vite les joueurs les moins
assidus sans compter les colonnes à l'œil.

Critères d'acceptation :

- En-têtes `Total` et `Moyenne` cliquables, même mécanique de tri que
  `MembersTable` (réutilisation de la logique de tri existante)
- Indice visuel de scroll horizontal (ombre ou chevron) quand le tableau
  dépasse la largeur visible, testé selon le nombre de semaines
- Libellé de semaine `S{saison} G{section}` complété par une info-bulle ou
  un libellé accessible portant la période, si disponible dans les données

---

#### US 6.8 (P2) — Contraste du texte rouge critique (WCAG AA)

**En tant qu'**utilisateur, **je veux** que les messages d'erreur et les
indicateurs critiques en rouge restent lisibles **afin de** respecter le
niveau AA (contraste ≥ 4,5:1 pour un texte de taille normale).

Critères d'acceptation :

- Le rouge utilisé pour le texte (`royale-red-500`, mesuré à 4,44:1 sur fond
  `royale-navy-950`) est ajusté pour atteindre ≥ 4,5:1, sans dénaturer
  l'identité visuelle Clash Royale
- Un contrôle automatisé (script ou test) vérifie le contraste des tokens de
  texte du thème contre leurs fonds d'usage
- Aucune régression sur les autres couleurs du thème (déjà toutes ≥ 4,5:1
  selon l'audit du 2026-08-02)

---

## 3. Ordre de réalisation et avancement

1. ✅ **US 1.1** — socle du projet
2. ✅ **US 1.3** — outillage de test (Vitest 80 % / domaine 100 %, Stryker 90 %)
3. ✅ **US 1.2** — MSW et fixtures (format API réel : `items[].standings[].clan.participants[].decksUsed`)
4. ✅ **US 1.5** — proxy API sécurisé (mutation 100 %)
5. ✅ **US 2.1** — CI bloquante GitHub Actions (lint, types, couverture, Stryker, build)
6. ✅ **US 4.2** — moteur de calcul `domain/war/war-history` (couverture 100 %, mutation 98 %, 5 mutants équivalents documentés)
7. ✅ **US 3.1 / 3.2** — dashboard membres (tri hiérarchique des rôles, tie-break nom puis tag, hook `useApiResource` testé sous Stryker)
8. ✅ **US 4.3 / 4.4** — historique croisé joueurs × semaines, classification aux bornes 11/12/15/16, jauges, distinction — / 0
9. ⬜ **US 1.4** — Playwright (**délégué à la passe testing dédiée**)
10. ✅ **US 4.1** — suivi en direct (`domain/war/current-war` : decks du jour /4, cumul /16, badge « A quitté le clan », tri par urgence)
11. ✅ **US 5.1** — vue de purge (`domain/clan/purge` : règle ET/OU explicite, seuil X configurable, motifs affichés)
12. ✅ **Épique 6** — audit UX du 2026-08-02 : US 6.1 à US 6.8 implémentées
    (en-tête de clan, deep-link `?clan=`, reprise après erreur par section,
    rafraîchissement + horodatage de la guerre en cours, saisie non
    intrusive, combinateur ET/OU et export de la purge, tri et scroll de
    l'historique, contraste AA du rouge critique). `purge.ts` et
    `use-debounced-value.ts` à 100 % de mutation ; le reste du périmètre
    touché à 95,6 % (mutants restants équivalents, documentés en commentaire)

### Finition produit (hors backlog initial)

- ✅ **Persistance du tag** : dernier clan inspecté mémorisé en
  `localStorage` et rechargé automatiquement au retour sur le site.
- ✅ **Colonne Moyenne** dans l'historique (complète le critère
  « colonne de synthèse » de l'US 4.3, en plus du Total).
- ✅ **Pages 404 / erreur** thématisées avec bouton de relance.
- ✅ **Favicon SVG** (épées croisées + couronne) et métadonnées OpenGraph.

### Dette de test assumée (à reprendre par la passe testing)

Les US 4.3, 4.4, 4.1 et 5.1 ont été livrées **code métier d'abord** sur
demande : les modules domaine sont purs et documentés. Mis à jour lors de
l'Épique 6 (audit UX du 2026-08-02) : `domain/war/current-war` et
`domain/clan/purge` ont désormais leur suite complète (100 % couverture,
98–100 % mutation) — nécessaire pour que le pipeline CI (seuil domaine
100 %, mutation 90 %) redevienne vert. Reste à écrire par l'agent testing :

- tests RTL pour `WarHistorySection`, `CurrentWarSection`, `PurgeSection`
  (couverture composant encore partielle, ~80–90 %, périmètre hors
  domaine donc non bloquant pour le seuil global 80 %) ;
- US 1.4 : Playwright + MSW (instrumentation Next `MOCK_API=1`), parcours
  critiques : recherche de clan → membres → historique → purge.

### Décisions techniques prises en cours de route

- **Comptage des combats** : `decksUsed` est la source officielle ; `wins`
  accepté en secours. Valeurs bornées dans [0, 16], aberrantes écrêtées.
- **Tags joueurs** : canonicalisés (casse, dièses, espaces) mais **non
  validés** contre l'alphabet Supercell — une donnée machine ne fait jamais
  perdre un participant. Le tag de **clan** (saisie humaine) reste validé
  strictement par `normalizeClanTag`.
- **Doublons de tag** dans une semaine : fusion en gardant le décompte le
  plus élevé (ne jamais sous-évaluer l'assiduité).
- **`null` vs `0`** dans `battlesByWeek` : `null` = pas membre cette
  semaine-là, `0` = présent mais aucun combat joué (exigence US 4.3).
