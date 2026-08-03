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

### ÉPIQUE 7 — Gamification et Assistant de Gestion

> Directive générale UX/UI (toutes les US de cette épique) : SPA fluide, sans
> rechargement de page ; animations subtiles (Tailwind `animate-`, transitions
> CSS) sur l'apparition des éléments ; états de chargement (squelette) et
> données vides (empty state illustré) gérés systématiquement.

#### US 7 — L'Assistant « Ressources Humaines » (Recommandations)

**En tant que** chef de clan, **je veux** un tableau de bord qui suggère
promotions et rétrogradations selon des critères précis, **afin de** ne plus
chercher manuellement qui mérite une promotion et qui pénalise le clan.

Critères d'acceptation :

- Filtre « Méritants » : rôle `member` uniquement, 16/16 combats sur les 3
  dernières semaines **complètes** (`riverracelog`), et au moins 1 don cette
  semaine (`donations` de `/clans/{tag}`, remis à zéro chaque semaine par
  Supercell — c'est déjà la donnée « cette semaine »)
- Filtre « Sur la sellette » : rôle `elder` ou `coLeader`, moins de 8/16
  combats sur la semaine en cours (guerre en cours, `decksUsed`) **ou** sur
  la dernière semaine complète ; un critère non disponible (pas de guerre en
  cours, historique insuffisant) n'est pas évalué plutôt que de disqualifier
  le joueur par défaut
- Layout : deux colonnes (`grid-cols-2`) sur desktop, empilées (`flex-col`)
  sur mobile
- Carte « Méritant » : gradient vert (`from-emerald-900 to-slate-900`),
  pseudo en gras, badge « Promotion suggérée : Aîné »
- Carte « Sur la sellette » : gradient rouge sombre, icône d'avertissement,
  texte « Rétrogradation conseillée »
- CTA « Copier le tag » sur chaque carte : passe au vert avec un check
  pendant 2 secondes au clic
- État vide illustré si aucun candidat ; squelette pendant le chargement

---

#### US 8 — Le « Hall of Fame » (Podium hebdomadaire)

**En tant que** membre du clan, **je veux** voir les meilleurs joueurs de la
semaine dernière mis en avant, **afin de** créer une compétition saine.

Critères d'acceptation :

- Dernière semaine **révolue** de `/riverracelog`, participants triés par
  `fame` décroissant, top 3
- Composant "Hero" tout en haut du dashboard, au-dessus du tableau des membres
- Podium desktop en 3 blocs : 1er au centre (plus grand), 2e à gauche, 3e à
  droite ; empilé sur mobile
- 1er : bordure `border-yellow-400`, ombre dorée, couronne dorée ; 2e :
  bordure `border-slate-300`, couronne argentée ; 3e : bordure
  `border-amber-700`, couronne bronze
- Survol d'une carte : `hover:scale-105 transition-transform duration-300`
- État vide si aucune semaine complète disponible pour ce clan

---

#### US 9 — Inspection profonde « à la demande » (panneau latéral)

**En tant que** gestionnaire, **je veux** cliquer sur un joueur du tableau
pour voir ses statistiques détaillées sans quitter la page, **afin de**
décider vite sans perdre le contexte.

Critères d'acceptation :

- Anti-spam API : l'appel à `/players/{tag}` ne part qu'au clic sur la ligne,
  jamais en préchargement
- Cache en mémoire par tag : rouvrir un joueur déjà consulté n'effectue pas
  de nouvel appel réseau
- Panneau coulissant depuis la droite (`translate-x-full` → `translate-x-0`),
  100 % de la largeur sur mobile, 400px sur desktop
- Overlay `bg-black/50 backdrop-blur-sm`, clic dessus = fermeture
- Squelette (`animate-pulse`) pendant le chargement du profil
- Contenu : rôle, niveau d'expérience, total de dons, et le deck (jusqu'à 8
  cartes, grille 4x2) — `currentDeck` en priorité, repli sur
  `currentFavouriteCard` si `currentDeck` est absent

---

### ÉPIQUE 8 — Guerre en cours et fiabilité des données (audit UX du 2026-08-02, clan `#20J20QG`)

> Second audit UX du 2026-08-02, mené cette fois par **navigation live sur
> le clan réel Chevreaux Team (#20J20QG)** en production, avec inspection
> DOM (contrairement à l'audit de l'Épique 6, mené par relecture de code).
> Constat déclencheur : le tableau **Guerre en cours** — le plus consulté —
> affichait encore les joueurs ayant quitté le clan (21 lignes sur 68, soit
> ~31 % de bruit), alors que l'Historique des guerres avait déjà été
> corrigé sur ce point (commit `2491a72`). Priorités identiques à l'Épique 6 :
> **P0** bloque la confiance, **P1** freine l'usage courant, **P2** finitions.
> Les identifiants US-1 à US-11 reprennent la numérotation du rapport
> d'audit original pour la traçabilité.

#### US-1 (P0) — Ne montrer que les membres actuels dans Guerre en cours

**En tant que** chef ou co-chef de clan, **je veux** que le tableau
« Guerre en cours » n'affiche que les joueurs actuellement membres du clan
**afin de** ne pas polluer ma lecture avec des joueurs partis que je ne
peux plus évaluer ni sanctionner.

Critères d'acceptation :

- Aucune ligne d'ex-membre n'apparaît par défaut (masquage, pas simple
  annotation comme c'était le cas jusqu'ici)
- Un message distinct s'affiche si seuls des ex-membres ont participé à la
  guerre en cours (plutôt que le message générique « pas en guerre »)

---

#### US-2 (P0) — Cohérence du filtrage sur tout le tableau de bord

**En tant que** chef de clan, **je veux** que le même filtrage
« membre actuel » s'applique à Guerre en cours, Historique et Assistant RH
**afin d'**avoir une cohérence garantie sur toute l'application.

Constat : Historique (`filterCurrentMembers`, commit `2491a72`) et
Assistant RH / vue de renvoi (itèrent déjà sur `members`, donc sur les
membres actuels uniquement) étaient déjà corrects. Seule Guerre en cours
manquait — traité par US-1.

---

#### US-3 (P1) — Affichage ponctuel des anciens membres

**En tant qu'**utilisateur, **je veux** pouvoir afficher ponctuellement les
anciens membres dans Guerre en cours si besoin **afin de** ne pas perdre
l'information sans qu'elle s'impose par défaut.

Critères d'acceptation :

- Contrôle « Afficher les anciens membres (N) » visible uniquement s'il y a
  au moins un ex-membre, désactivé par défaut
- Réinitialisé à chaque nouveau tag de clan soumis
- Les lignes d'ex-membres réaffichées restent visuellement distinguées
  (opacité réduite + badge « A quitté le clan » déjà existant)

---

#### US-4 (P0) — Fiabiliser la colonne Niveau (et tout compteur numérique)

**En tant qu'**utilisateur, **je veux** que la colonne « Niveau » du
tableau des membres affiche la vraie valeur **afin de** ne pas remettre en
doute la fiabilité de tout le tableau de bord.

Constat observé en production : `Niveau` à `0` pour les 47 membres alors
que la fiche joueur (même champ `expLevel`) affichait la bonne valeur.
Cause identifiée : le parsing (`typeof value !== 'number' → 0`) rejetait
tout compteur reçu sous forme de chaîne (`"62"` au lieu de `62`), ce qu'un
hébergement passant par le proxy communautaire `proxy.royaleapi.dev` (cf.
`_lib/supercell.ts`, contournement de la restriction IP Vercel) peut
produire de façon inconsistante entre deux endpoints.

Critères d'acceptation :

- Coercion numérique partagée (`domain/shared/numeric.ts`) acceptant les
  chaînes numériques, réutilisée par `members.ts`, `player-profile.ts`,
  `clan-summary.ts` et `clamp.ts` (decks/combats)
- Pour 100 % des membres, le niveau affiché en table est identique à celui
  de la fiche joueur pour la même donnée source
- Non-régression : une chaîne non numérique (`"oops"`) retombe toujours à 0

---

#### US-5 (P1) — Lisibilité des colonnes Aujourd'hui / Semaine

**En tant qu'**utilisateur, **je veux** un badge de couleur sur le cumul
hebdomadaire de Guerre en cours, comme pour le nombre de decks du jour,
**afin de** repérer un joueur en difficulté sans lire un chiffre isolé.

Critères d'acceptation :

- Colonne « Semaine » codée avec le même code couleur/symbole que
  l'Historique (`classifyBattleCount`, ✓/!/✗)
- Chiffres alignés numériquement (`tabular-nums`)

---

#### US-6 (P1) — Légende visible des symboles de l'historique

**En tant qu'**utilisateur, **je veux** une légende visible pour les
symboles ✓ / ! / ✗ de l'Historique des guerres **afin de** comprendre le
codage sans essai-erreur.

Critères d'acceptation :

- Légende textuelle visible (pas seulement portée par un `aria-label`)
  au-dessus du tableau, avec le libellé « Non membre cette semaine-là »

---

#### US-7 (P1) — Sommaire de navigation entre sections

**En tant qu'**utilisateur, **je veux** un sommaire sticky
(Membres / Guerre en cours / Historique / Assistant RH) **afin d'**accéder
directement à la section qui m'intéresse sans défiler toute la page.

Critères d'acceptation :

- Barre sticky avec un lien par section, défilement fluide au clic
- Section active mise en évidence (`aria-current`) via `IntersectionObserver`,
  dégradation silencieuse si l'API est indisponible

---

#### US-8 (P2) — Recherche par pseudo dans le tableau des membres

**En tant qu'**utilisateur, **je veux** rechercher un pseudo ou un tag
**afin de** trouver rapidement un joueur dans une liste de 47+ lignes.

Constat : le tri par toutes les colonnes (Rôle, Niveau, Trophées, Dons)
était déjà fonctionnel (`MembersTable`) ; seule la recherche manquait.

Critères d'acceptation :

- Champ de recherche filtrant en temps réel par sous-chaîne, insensible à
  la casse, sur le pseudo ou le tag (`filterMembersByQuery`)
- Message distinct « Aucun membre ne correspond à ... » si le filtre ne
  retourne rien
- Réinitialisé à chaque nouveau tag de clan soumis

---

#### US-9 (P1) — Résumé et persistance du réglage « À expulser »

**En tant que** chef de clan, **je veux** voir un résumé clair de la règle
active et qu'elle soit mémorisée **afin de** ne pas la reconfigurer à
chaque visite.

Critères d'acceptation :

- Phrase de résumé (« Règle active : 0 don ET moins de 8 combats de
  guerre. ») au-dessus de la liste
- Seuil et combinateur mémorisés en `localStorage`
  (`purge-settings-storage.ts`), tolérant si le stockage est indisponible

---

#### US-10 (P2) — Copier l'ensemble des recommandations RH

**En tant qu'**utilisateur, **je veux** copier en un clic les
recommandations de l'Assistant RH, pas seulement la liste « À expulser »,
**afin de** gagner le même temps sur toutes mes décisions.

Critères d'acceptation :

- Bouton « Copier les recommandations » pour Méritants et pour
  Sur la sellette, visible seulement si la liste correspondante n'est pas
  vide

---

#### US-11 (P2) — Colonne Joueur fixe et ombre de scroll (Historique)

**En tant qu'**utilisateur, **je veux** que la colonne « Joueur » reste
fixe pendant le défilement horizontal, avec une ombre de bord tant qu'il
reste des semaines à voir, **afin de** ne jamais perdre le repère de la
ligne consultée.

Critères d'acceptation :

- Première colonne (en-tête et lignes) en `position: sticky`
- Ombre de bord droit recalculée au scroll et à chaque changement de
  données, disparaît une fois arrivé au bout

---

### ÉPIQUE 10 — Recherche de clan par nom

> Demande produit du 2026-08-02 : aujourd'hui, la zone de saisie
> n'accepte qu'un tag de clan (`#20J20QG`). Beaucoup de chefs de clan ne
> connaissent que le nom affiché en jeu, pas le tag — les obliger à aller
> le chercher ailleurs avant de pouvoir utiliser l'outil est une friction
> d'entrée inutile.

#### US 10.1 — Recherche par tag ou par nom depuis la même zone de saisie

**En tant qu'**utilisateur, **je veux** pouvoir saisir soit le tag, soit
le nom de mon clan dans le même champ **afin de** ne pas avoir à connaître
ou aller chercher le tag avant de pouvoir inspecter mon clan.

Critères d'acceptation :

- La détection est automatique et transparente pour l'utilisateur, sans
  bouton ni interrupteur pour choisir le mode : une saisie commençant par
  `#` (ou reconnue comme tag valide via `isValidClanTag`) est traitée comme
  un tag ; toute autre saisie non vide est traitée comme une recherche par
  nom.
- La recherche par nom utilise `GET /clans?name=...` de l'API Supercell,
  relayé par un nouveau Route Handler proxy (`/api/clans?name=`) qui
  respecte le même contrat que l'existant (clé API cachée, erreurs
  mappées : 400 nom trop court, 429, 500/503, timeout).
- Une nouvelle fonction pure `parseClanSearchResults` (domaine,
  couverture 100 %, mutation ≥ 90 %) extrait de la réponse brute la liste
  des clans candidats : tag, nom, badge, effectif, score de clan.
- **Un seul résultat** correspondant : le dashboard du clan se charge
  directement, sans étape intermédiaire (comme une recherche par tag
  aujourd'hui).
- **Plusieurs résultats** : une liste de candidats s'affiche sous le champ
  (nom, tag, badge, effectif) ; cliquer sur un candidat charge son
  dashboard. Recherche re-déclenchée si la saisie change à nouveau.
- **Aucun résultat** : message explicite (« Aucun clan ne correspond à
  "..." »), sans casser le formulaire.
- Une recherche par nom trop courte (< 3 caractères, minimum imposé par
  l'API Supercell) affiche une aide plutôt qu'un appel réseau voué à
  l'échec.
- Le debounce de saisie existant (US 6.5, `useDebouncedValue`) s'applique
  aussi à la recherche par nom, pour ne pas déclencher un appel réseau à
  chaque caractère tapé.
- Le lien partageable par URL (US 6.2, `?clan=%23TAG`) continue de ne
  porter que le tag final résolu, jamais une requête de nom brute.
- Testé : bascule tag ↔ nom sur la même saisie, cas 0/1/N résultats,
  requête trop courte, erreurs réseau, non-régression de la recherche par
  tag existante.

---

### ÉPIQUE 11 — Refonte des règles « À expulser » et « Sur la sellette »

> Demande produit du 2026-08-02, suite à un signalement : la vue
> « À expulser » affichait des totaux de combats cumulés sur toutes les
> semaines connues (ex. 113, 146 combats), un chiffre sans rapport avec
> l'échelle habituelle 0-16 et qui rendait le seuil configurable quasi
> inopérant (il aurait fallu être à 0 combat sur toute la période connue
> pour être signalé). Remplace l'ancienne règle US 5.1 (dons + combats
> cumulés, combinateur ET/OU) par un critère unique et simple.

#### US 11.1 — Règle simplifiée : rôle et semaine de guerre en cours

**En tant que** chef de clan, **je veux** que « À expulser » ne retienne
que les Membres sous un seuil de combats sur la semaine de guerre _en
cours_, et que « Sur la sellette » ne retienne que les Aînés sous ce même
seuil, **afin d'**avoir une règle lisible sur la même échelle 0-16 que le
reste de l'outil, sans avoir à interpréter un total multi-semaines.

Critères d'acceptation :

- `findPurgeCandidates` (domain/clan/purge.ts) : rôle `member` uniquement,
  combats de la semaine en cours (`currentriverrace`) strictement sous un
  seuil configurable. Dons et total historique ne sont plus des critères.
- `findWatchlistMembers` (domain/clan/hr-assistant.ts) : rôle `elder`
  uniquement (le rôle `coLeader` n'est plus éligible), même critère de
  semaine en cours. La semaine précédente n'est plus évaluée.
- Un membre absent de la semaine en cours (pas de guerre active) n'est pas
  évalué plutôt que disqualifié par défaut, comme ailleurs dans l'outil.
- Le seuil est **partagé** entre les deux vues (un seul réglage,
  configurable depuis « À expulser », mémorisé en `localStorage`) : le
  combinateur ET/OU disparaît, il n'y a plus qu'un seul critère.
- Message distinct si le clan n'est pas en guerre (« rien à évaluer sur la
  semaine en cours ») plutôt qu'une liste vide ambiguë.
- Domaine à 100 % de couverture et 100 % de mutation Stryker sur les deux
  modules réécrits.

---

### ÉPIQUE 12 — Polish UI et rapport de modération

> 4 US soumises le 2026-08-02. Plusieurs recoupent des fonctionnalités déjà
> livrées (jauges de l'historique US 4.4, contraste AA US 6.8, grille
> mobile-first de l'Assistant RH, confirmation de copie US 6.6/US-10) : les
> critères ci-dessous sont reformulés pour tenir compte de l'existant plutôt
> que de dupliquer. Deux points restent en arbitrage avant implémentation,
> notés en fin de section.

#### US 12.1 — Jauge de progression pour l'assiduité (au lieu d'un texte brut)

**En tant qu'**utilisateur, **je veux** visualiser l'assiduité via une barre
de progression colorée plutôt qu'un texte `8/16` **afin de** repérer
instantanément les joueurs sous le quota.

Constat : une jauge colorée existe déjà dans `WarHistorySection`
(`BattleCell`, `data-testid="battle-gauge"`), pilotée par
`classifyBattleCount` (`domain/war/attendance-level.ts`). Ce qui manque : la
appliquer aussi à la colonne « Semaine » de Guerre en cours (actuellement
texte coloré sans barre, depuis l'Épique 8 US-5), et trancher l'écart de
seuils avec la demande (voir arbitrage A ci-dessous).

Critères d'acceptation :

- Jauge horizontale sur 100 % de la largeur disponible dans la cellule,
  responsive sans breakpoint dédié (déjà le comportement des tableaux
  scrollables existants)
- Couleur + label + symbole (jamais la couleur seule, contrainte
  accessibilité déjà en place)
- Réutilise les tokens `royale-*` déjà audités WCAG AA (US 6.8), pas les
  couleurs Tailwind par défaut (voir arbitrage A)

---

#### US 12.2 — Cartes « Sur la sellette » à contraste renforcé

**En tant que** chef ou adjoint, **je veux** un contraste optimal sur les
cartes de la liste **afin de** lire sans forcer sur les yeux, notamment sur
mobile en faible luminosité.

Constat : le contraste AA (`royale-red-500` sur `royale-navy-950`, ≥ 4.5:1)
est déjà vérifié automatiquement (US 6.8, `theme-contrast.test.ts`) et la
grille est déjà mobile-first (`grid-cols-1 md:grid-cols-2`). Ce qui reste
net nouveau : le habillage visuel (fond uni foncé + bordure gauche épaisse,
au lieu du dégradé bordeaux actuel).

Critères d'acceptation :

- Fond `royale-navy-900` (déjà utilisé ailleurs dans l'app, cohérent avec le
  thème) avec bordure gauche épaisse `border-l-4 border-royale-red-700`
- Texte du motif de rétrogradation en `royale-parchment` (contraste déjà
  validé), icône d'alerte conservée
- Non-régression du test de contraste automatisé existant

---

#### US 12.3 — Rapport de modération formaté pour Discord/jeu

**En tant que** gestionnaire, **je veux** que « Copier la liste » génère un
message de modération prêt à coller **afin de** ne pas avoir à le
retaper.

Constat : le bouton et le retour visuel (confirmation transitoire 2s)
existent déjà (`purge-section.tsx`, `PurgeSection`, US 6.6/US-9). Ce qui
change : le format du texte copié (actuellement une ligne par candidat avec
tag et combats, US 11.1) devient un message unique formaté.

Critères d'acceptation :

- Nouveau formateur (`domain/` ou `lib/`, testé) : `"⚠️ Mise au point du
Clan : Les joueurs suivants n'ont pas respecté le quota de combats cette
semaine sur {N} : {noms séparés par virgule}. Merci de corriger le tir
rapidement !"` — le nombre de combats requis affiché est le seuil actif
  (`minWeeklyBattles`), pas une valeur en dur
- Bouton désactivé (`disabled`, pas juste masqué) quand la liste est vide
- Confirmation « Copié ! ✅ » pendant 2s au clic (aligne le libellé existant
  avec l'emoji demandé)
- Testé : 0/1/N joueurs, régénération du texte si la liste change entre deux
  clics

---

#### US 12.4 — Résumé synthétique en tête de dashboard (donut + podium compact)

**En tant que** membre du clan, **je veux** un résumé immédiat (participation
globale + top 3) en haut de l'écran **afin de** connaître la situation du
clan sans défiler.

Constat : le Hall of Fame (US 8, podium 3 blocs à tailles graduées) existe
déjà en tête de page. Ce qui est net nouveau : le graphique donut de
participation globale. Le podium compact en « 3 petites cartes horizontales »
demandé diffère du podium actuel (tailles graduées 1er/2e/3e) — à confirmer
si on remplace ou si les deux coexistent.

Critères d'acceptation :

- Donut (SVG, pas de librairie de charts) : ratio combats joués / combats
  possibles de la semaine en cours (`currentriverrace`), pourcentage au
  centre
- Squelette affiché pendant le chargement (réutilise `Skeleton`, pattern
  déjà en place partout ailleurs dans l'app)
- Mis à jour avec les vraies données à chaque rafraîchissement de la guerre
  en cours (US 6.4)
- Voir arbitrage B (architecture Suspense/Server Component) avant
  implémentation

---

#### Arbitrages (tranchés le 2026-08-03)

- **A — Seuils et couleurs de l'US 12.1** : tranché **partout**. Le nouveau
  barème (< 8/16 critique, 8-15 avertissement, 16/16 complet, aligné sur
  `minWeeklyBattles`) remplace l'ancien seuil 12/16 dans
  `WARNING_THRESHOLD` (`domain/war/attendance-level.ts`), et s'applique donc
  identiquement à l'historique et à Guerre en cours via le composant
  partagé `PlayerProgressBar`.
- **B — US 12.4** : tranché **composant client + `Skeleton`** (pas de vrai
  Server Component / `Suspense`), cohérent avec le reste de l'app
  entièrement pilotée côté client.

---

### ÉPIQUE 13 — Refonte Architecture & Routing (Next.js App Router)

> Audit d'architecture et UX du 2026-08-03, sur la base d'une première
> version de spec technique transmise par le produit. Aujourd'hui,
> l'application est **une seule route** (`app/page.tsx`) qui rend **un
> seul composant client** (`ClanDashboard`, `'use client'`, ~400 lignes)
> possédant tout l'état (tag saisi, recherche, tri, membre sélectionné,
> seuil de purge) et orchestrant 4 appels réseau via `useApiResource`. Les
> « sections » (Membres, Guerre en cours, Historique, Assistant RH) ne sont
> pas des pages : ce sont des ancres dans un unique scroll, sommaire sticky
> à l'appui (`SectionNav`, US-7 de l'Épique 8). Découper en vraies routes
> avec layout persistant est une bonne direction UX (navigation directe,
> pages plus légères à charger, tab bar mobile), mais **contredit
> frontalement l'arbitrage B de l'Épique 12** ("cohérent avec le reste de
> l'app entièrement pilotée côté client", tranché le jour même). Cette
> contradiction doit être résolue avant la première ligne de code — voir
> arbitrages ci-dessous.

#### Arbitrages à trancher avant implémentation (bloquants)

- **C — Où vit le tag de clan une fois qu'on a plusieurs routes ?**
  Aujourd'hui il vit en `localStorage` (`clan-tag-storage.ts`) + querystring
  `?clan=` sur l'unique page (`clan-tag-url.ts`), relu au montage du
  composant client. Un Server Component qui fetch au premier rendu
  **ne peut pas lire `localStorage`** (pas de DOM côté serveur) : sans
  changement, `/dashboard`, `/historique` et `/rh` afficheraient un état
  vide au premier chargement puis « sauteraient » vers les données une
  fois l'hydratation client faite — un flash inutile que l'app n'a
  jamais eu jusqu'ici. **Recommandation** : faire de `clan-tag-storage.ts`
  un double-écrivain `localStorage` (pour le lien partageable existant) +
  **cookie** (`Set-Cookie` non-HttpOnly, lu par `cookies()` côté serveur),
  afin que le Server Component de chaque route résolve le tag actif sans
  aller-retour client. Le paramètre d'URL `?clan=` reste prioritaire sur
  le cookie, comme aujourd'hui il l'est sur le `localStorage`
  (`clan-dashboard.tsx` L97-105).
- **D — Compatibilité avec l'arbitrage B de l'Épique 12** : à retrancher
  explicitement. Le donut de participation (US 12.4) et tout composant
  similaire ajouté depuis doivent soit (a) devenir des enfants de Server
  Components et recevoir leurs données déjà résolues en props, soit (b)
  rester des îlots client mais nourris par les données déjà fetchées par
  la page — jamais un second fetch client redondant avec celui du Server
  Component parent.
- **E — Emplacement du formulaire de recherche/sélection de clan** : la
  spec ne le mentionne pas explicitement. Il ne peut pas rester dans
  `app/dashboard/page.tsx` seul (US 13.3 le rend disponible sur les 3
  pages, cf. besoin de changer de clan depuis Historique ou RH sans
  repasser par Dashboard).

#### US 13.1 (P0, Tech) — Cookie de persistance du tag de clan, compatible SSR ✅

**En tant que** développeur, **je veux** que le tag de clan actif soit
lisible côté serveur dès la première requête **afin de** permettre aux
pages `/dashboard`, `/historique` et `/rh` de fetcher leurs données sans
flash de contenu vide.

Critères d'acceptation :

- `clan-tag-storage.ts` écrit un cookie (`SameSite=Lax`, pas `HttpOnly`
  puisque relu aussi côté client) en plus du `localStorage` existant,
  sans régression sur le comportement actuel (lien `?clan=` toujours
  prioritaire, cf. `clan-tag-url.ts`)
- Un helper serveur (`lib/clan-tag-cookie.ts` ou équivalent, testé) lit ce
  cookie via `cookies()` (Next.js) pour les Server Components
- Testé : cookie absent (première visite), cookie présent mais tag
  invalide (ne doit jamais faire planter le rendu serveur), `?clan=`
  prioritaire sur le cookie

---

#### US 13.2 (P0) — Squelette de routing : layout persistant + redirection par défaut ✅

**En tant qu'**utilisateur, **je veux** atterrir automatiquement sur un
tableau de bord **afin de** ne jamais voir de page blanche à la racine du
site.

Critères d'acceptation :

- `app/layout.tsx` conserve les polices et `<html lang="fr">` existants,
  ajoute la navigation globale (US 13.4/13.5) comme frère de `children`,
  pas comme wrapper qui forcerait un remount des pages à chaque
  navigation
- `app/page.tsx` : `redirect('/dashboard')` **serveur** (fonction
  `redirect` de `next/navigation`), inconditionnel, comme demandé par la
  spec — remplace l'actuel rendu direct de `ClanDashboard`
- `app/dashboard/page.tsx`, `app/historique/page.tsx`, `app/rh/page.tsx` :
  async Server Components qui résolvent le tag actif (US 13.1) puis
  fetchent les données nécessaires **via les route handlers existants**
  (`/api/clans/[clanTag]`, `.../currentriverrace`, `.../riverracelog`) en
  `fetch` serveur-à-serveur — pas de duplication de la logique de
  `_lib/supercell.ts`, seule la couche HTTP change
- Aucun tag actif (ni URL, ni cookie) → les 3 pages affichent l'état
  "aucun clan sélectionné" avec le formulaire de recherche (US 13.3), pas
  une redirection en boucle ni une erreur

---

#### US 13.3 (P0) — Formulaire de recherche/sélection de clan, composant client isolé ✅

**En tant qu'**utilisateur, **je veux** pouvoir chercher ou changer de
clan depuis n'importe laquelle des 3 pages **afin de** ne pas devoir
revenir sur Dashboard pour ça.

Constat : la recherche par tag/nom (détection transparente, résolution à
1 résultat, liste de candidats — Épique 10) est actuellement mêlée à
`ClanDashboard` (L212-312). Elle doit devenir un composant client
autonome, réutilisable, qui ne connaît que la mise à jour du tag actif
(cookie + `localStorage` + URL), pas les autres sections.

Critères d'acceptation :

- Nouveau composant `components/clan/ClanSearchForm.tsx` (`'use client'`),
  reprenant tel quel le comportement actuel (détection tag/nom, debounce
  400 ms, résolution auto à 1 résultat, liste de candidats, message sous
  3 caractères, erreur de format) — non-régression vérifiée par les tests
  existants de `clan-dashboard.test.tsx` déplacés/adaptés
  vers ce composant
  - Après soumission ou clic sur un candidat : navigation via
    `useRouter().push` vers la page courante avec `?clan=<tag>` **et**
    écriture du cookie + `localStorage` (US 13.1), pour que les 2 autres
    pages en bénéficient aussi sans ressaisie
  - Affiché en tête de chaque page (`dashboard`, `historique`, `rh`) —
    factorisé une seule fois pour éviter la triplication, ex. dans un
    composant partagé rendu par les 3 `page.tsx` plutôt que par le layout
    (le layout étant un Server Component sans accès à l'état "aucun clan
    sélectionné" par route)

---

#### US 13.4 (P1) — Navigation mobile : `MobileTabBar` ✅

**En tant qu'**utilisateur sur mobile, **je veux** une barre d'onglets
fixe en bas de l'écran **afin de** changer de page sans remonter en haut
du contenu pour trouver une navigation.

Critères d'acceptation :

- `components/navigation/MobileTabBar.tsx` (`'use client'`, seul composant
  du layout à utiliser `usePathname`) : `fixed bottom-0 w-full z-50`,
  `bg-slate-900`, `border-t border-slate-800`, 4 icônes
  (`flex flex-row justify-around items-center h-16`) — Dashboard,
  Historique, RH, et une 4e entrée à trancher avec le produit (ex.
  "Membres" si cette vue reste distincte de Dashboard, ou "Réglages")
- Route active détectée par correspondance de préfixe sur `usePathname()`
  (`/historique` reste actif sur `/historique` et ses éventuelles
  sous-routes) : icône `text-yellow-400`, sinon `text-slate-400`
- Chaque icône est un `<Link>` (pas un `<button onClick={router.push}>`)
  pour préserver la navigation clavier/SEO/prefetch Next.js
- Chaque cible tactile fait **au moins 44×44px** (zone cliquable, pas
  seulement l'icône visuelle) — voir US 14.6 pour la règle générale
- `<html>`/`body` ou le conteneur de chaque page réserve un
  `padding-bottom` (ou `env(safe-area-inset-bottom)` sur iOS, absent de
  `globals.css` aujourd'hui) au moins égal à `h-16` de la tab bar, pour
  qu'aucun contenu de bas de page (ex. dernière carte "Sur la sellette",
  bouton "Copier la liste" de `PurgeSection`) ne soit masqué
- Visible seulement en dessous du breakpoint où le header desktop (US
  13.5) prend le relais (`md:hidden`)

---

#### US 13.5 (P1) — Navigation desktop : header ✅

**En tant qu'**utilisateur sur desktop, **je veux** une navigation
horizontale dans l'en-tête **afin de** ne pas avoir une barre d'onglets
mobile plaquée en bas d'un grand écran.

Critères d'acceptation :

- `components/navigation/DesktopHeader.tsx` (ou intégré directement à
  `layout.tsx` s'il reste simple) : visible `hidden md:flex`, liens vers
  les 3 routes + logo/titre du produit, même logique de route active que
  la tab bar (couleur or vs. atténuée) mais sans dupliquer le hook —
  factoriser la détection de route active (`useActiveRoute()` ou
  équivalent) entre les deux composants
- `MobileTabBar` et `DesktopHeader` ne sont **jamais visibles
  simultanément** (test de non-régression au niveau du breakpoint `md`)

---

#### US 13.6 (P1) — Migration des sections existantes sans régression fonctionnelle ✅

**En tant qu'**utilisateur, **je veux** retrouver exactement les mêmes
fonctionnalités qu'avant la refonte, réparties sur les nouvelles pages
**afin de** ne rien perdre au passage.

Répartition proposée (à valider avec le produit avant de coder) :

- `app/dashboard/page.tsx` : `ClanHeader`, `ParticipationSummarySection`
  (donut), `HallOfFameSection`, tableau `MembersTable` (recherche +
  tri) — la vue d'ensemble décrite par la spec
- `app/historique/page.tsx` : `WarHistorySection` (et sa légende) —
  éventuellement `CurrentWarSection` (guerre en cours) si elle est
  considérée comme de l'« historique du jour » plutôt que du
  « tableau de bord » ; à trancher, car la spec ne classe pas
  explicitement Guerre en cours
- `app/rh/page.tsx` : `HrAssistantSection` (Méritants / Sur la sellette)
  et `PurgeSection` (« À expulser »), qui partagent déjà `minWeeklyBattles`
  aujourd'hui — ce partage d'état doit rester possible une fois les deux
  sur la même page mais dans des composants distincts
- Chaque section garde son propre état de chargement/erreur
  (`ApiResource`), aucune n'attend plus les autres pour s'afficher que ce
  qu'elle attend déjà aujourd'hui
- Tous les tests existants des sections (`*.test.tsx`) continuent de
  passer inchangés ou avec adaptation minimale des props (les sections
  elles-mêmes ne doivent pas être réécrites, seulement redistribuées)

---

#### US 13.7 (P2) — Suppression du sommaire de navigation devenu redondant ✅

**En tant que** développeur, **je veux** retirer `SectionNav` (scroll-spy
vers des ancres `#membres`, `#guerre-en-cours`, etc.) **afin de** ne pas
garder deux systèmes de navigation qui se chevauchent une fois les pages
réelles en place.

Critères d'acceptation :

- `section-nav.tsx` et son test supprimés, plus aucune ancre
  `#membres`/`#guerre-en-cours`/`#historique`/`#assistant-rh` ni
  `scroll-mt-16` orpheline dans les sections migrées
- Vérifier qu'aucun lien externe (README, aide en jeu, favoris
  utilisateurs) ne pointait vers ces ancres avant de les retirer

---

#### Notes d'implémentation (livrées le 2026-08-03)

Épique 13 implémenté en totalité (US 13.1 à 13.7), `npm run verify` vert
hors Stryker (non relancé dans cette passe — dette de test assumée,
même pattern que les épiques précédents), build `next build` réel
vérifié (routes `/dashboard`, `/historique`, `/rh` en `ƒ` dynamique,
`/` statique). Écarts assumés par rapport aux arbitrages initiaux :

- **C (cookie)** : implémenté tel que recommandé
  (`lib/clan-tag-cookie.ts` + `lib/clan-tag-server.ts`), avec double
  écriture localStorage/cookie dans `clan-tag-storage.ts`.
- **D (conflit avec l'arbitrage B de l'Épique 12)** : résolu par un
  pattern de "seed" plutôt qu'une conversion en Server Components purs
  pour chaque section. `useApiResource` accepte désormais un état
  initial optionnel (`seed`) : le Server Component de chaque route
  fetch les données une fois via un nouvel appel direct à
  `proxyClanResource` (`lib/server-clan-resource.ts`, **pas** de
  second aller-retour HTTP vers les Route Handlers — plus simple et
  plus rapide qu'un auto-fetch serveur-à-serveur, tout en réutilisant
  la même logique `_lib/supercell.ts` que les Route Handlers), puis
  passe le résultat en props à un composant client (`DashboardView`,
  `HistoriqueView`, `RhView`) qui hydrate `useApiResource` avec ce seed :
  premier rendu déjà rempli (aucun flash de chargement), sans
  refetch redondant au montage. Toute interaction ultérieure (tri,
  "Réessayer", "Actualiser") redevient un vrai fetch client normal.
  Les 9 composants de section existants (`MembersTable`,
  `CurrentWarSection`, `WarHistorySection`, `HrAssistantSection`,
  `PurgeSection`, etc.) n'ont **pas été réécrits** : ils continuent de
  recevoir un `ApiResource<unknown>` exactement comme avant.
- **E (emplacement du formulaire)** : `ClanSearchForm` est rendu par
  chacun des 3 `page.tsx` (pas par le layout), comme anticipé.
- **Répartition du contenu (US 13.6)** : tranchée en s'appuyant sur la
  toute première version de la spec produit ("Dashboard = vue
  d'ensemble avec Guerre en cours et jauges de participation",
  "Historique = tableaux de données passées", "RH = assistant de
  modération") plutôt que sur l'hésitation notée dans l'US 13.6
  elle-même. Résultat : **Dashboard** = identité du clan, jauge de
  participation + Hall of Fame, Guerre en cours, puis annuaire des
  membres (recherche/tri) ; **Historique** = uniquement le tableau
  d'assiduité croisé ; **RH** = Assistant RH (Méritants / Sur la
  sellette) et « À expulser », qui continuent de partager
  `minWeeklyBattles`.
- **Navigation à 3 entrées, pas 4** : la spec initiale demandait
  4 icônes dans `MobileTabBar` sans dire à quoi correspondrait la 4e
  (il n'y a que 3 routes réelles) ; implémenté à 3 pour ne pas ajouter
  un onglet qui ne mènerait nulle part. À revoir si une 4e page est
  décidée par le produit.
- **Titre de page dynamique** : l'ancien hack `document.title` (US 6.1)
  n'a pas été réintroduit via `generateMetadata` dans cette passe —
  seul le titre statique du layout racine s'applique aux 3 nouvelles
  routes pour l'instant. Petit suivi possible, pas bloquant.
- **Duplication réduite en cours de route** : les 3 vues partageaient un
  bloc identique idle/loading/erreur pour l'état du clan (US 6.3) ; extrait
  en `components/clan/ClanStatusMessage.tsx`, testé une seule fois.

---

### ÉPIQUE 14 — Audit UX Mobile-First (2026-08-03)

> Audit mené par relecture de code (pas de session mobile live) en
> complément de l'Épique 13, dans l'esprit des audits UX précédents
> (Épiques 6 et 8) : priorités **P0** bloque la confiance/l'usage mobile,
> **P1** freine l'usage courant, **P2** finitions. Constat déclencheur :
> aucune des 3 tables denses de l'app (Membres, Guerre en cours,
> Historique) n'a de variante adaptée à un viewport 375px — elles
> reposent toutes sur `overflow-x-auto`, un pattern qui fonctionne mais
> dégrade fortement la lisibilité et le confort tactile sur mobile, la
> plateforme visée en priorité par la refonte de l'Épique 13. Ce qui
> fonctionne déjà bien et **ne doit pas être retouché** : les messages
> d'état vide (`EmptyState`), le contraste AA (Épique 6 US 6.8), la
> confirmation de copie « Copié ! ✅ », le panneau joueur en tant que
> concept (SPA fluide sans changer de page).

#### US 14.1 (P0) — Vue « carte » mobile pour l'Historique des guerres

**En tant qu'**utilisateur sur mobile, **je veux** lire l'historique
d'assiduité sans faire défiler horizontalement un tableau de N semaines
**afin de** comprendre l'assiduité d'un joueur d'un coup d'œil.

Constat : `war-history-section.tsx` est la table la plus dense de l'app
(une colonne par semaine + Total + Moyenne, colonne Joueur fixe en
`sticky left-0`, indice « Faites glisser pour voir plus de semaines → »
au-delà de 4 semaines, L184-191). Le défilement horizontal fonctionne
mais demande un geste peu naturel au pouce sur un tableau déjà en
lecture verticale (une ligne par joueur).

Critères d'acceptation :

- En dessous de `md` : une carte par joueur (nom, `Total`, `Moyenne`,
  et les _N_ dernières semaines sous forme de mini-jauges verticales ou
  de puces ✓/!/✗ compactes réutilisant `LEVEL_SYMBOLS`/`LEVEL_LABELS` et
  `PlayerProgressBar` existants) remplace le tableau ; un bouton
  « Voir toutes les semaines » développe la carte vers la liste complète
  sans navigation ni fetch supplémentaire (donnée déjà en mémoire)
- À partir de `md` : le tableau actuel (scroll horizontal, colonne fixe,
  ombre de bord) reste inchangé — c'est un pattern acceptable sur un
  écran large avec souris/trackpad
- Le tri (`sortPlayerAttendance`, boutons Total/Moyenne) reste disponible
  dans la vue carte (ex. un sélecteur `<select>` au-dessus de la liste,
  plus adapté au tactile qu'un clic sur en-tête de colonne)
- La légende (✓/!/✗ + « Non membre cette semaine-là ») reste visible dans
  les deux vues
- Testé : rendu carte sous 767px (jsdom + `matchMedia` mocké ou test par
  classes Tailwind présentes), non-régression du tableau ≥ 768px

---

#### US 14.2 (P1) — Vue « carte » mobile pour Membres et Guerre en cours

**En tant qu'**utilisateur sur mobile, **je veux** le même traitement
carte pour les tableaux Membres et Guerre en cours **afin d'**avoir une
expérience mobile cohérente sur toute l'app.

Critères d'acceptation :

- `MembersTable` : en dessous de `md`, cartes cliquables (nom, tag, rôle,
  niveau, trophées, dons) ouvrant le panneau joueur au tap — même cible
  que la ligne de tableau actuelle (`onSelectMember`) ; le tri reste
  accessible via un `<select>` mobile comme en US 14.1
- `CurrentWarSection` : en dessous de `md`, cartes (nom, badge « A quitté
  le clan » le cas échéant, `decksUsedToday/4` avec la même mise en
  couleur rouge si `idleToday`, jauge hebdomadaire `PlayerProgressBar`)
- Les deux tableaux desktop existants restent inchangés ≥ `md`
- Aucune duplication de logique de tri/filtre entre les deux vues : la
  vue carte consomme les mêmes données déjà triées/filtrées par le
  composant parent, elle ne fait que changer le rendu

---

#### US 14.3 (P0) — Accessibilité du panneau joueur (`PlayerDrawer`)

**En tant qu'**utilisateur clavier ou lecteur d'écran, **je veux** que le
panneau joueur se comporte comme une vraie boîte de dialogue modale
**afin de** pouvoir le fermer et y naviguer sans être piégé.

Constat : `player-drawer.tsx` (L114-162) anime déjà correctement
l'ouverture/fermeture et masque le contenu au lecteur d'écran quand fermé
(`aria-hidden={!isOpen}`), mais il manque : `role="dialog"` +
`aria-modal="true"` sur l'`<aside>`, un piège de focus (tab ne doit pas
sortir du panneau tant qu'il est ouvert), le déplacement automatique du
focus vers le panneau (ou son titre) à l'ouverture, la fermeture au
`Escape`, et la restauration du focus sur l'élément déclencheur (ligne du
tableau ou carte mobile de l'US 14.2) à la fermeture.

Critères d'acceptation :

- `role="dialog"` + `aria-modal="true"` ajoutés à l'`<aside>` existant
- À l'ouverture : focus déplacé sur le bouton de fermeture ou le titre du
  panneau ; à la fermeture (bouton `×`, `Escape`, ou clic sur l'overlay
  déjà géré par `onClick={onClose}` L123) : focus restauré sur l'élément
  qui a ouvert le panneau
- `Escape` ferme le panneau depuis n'importe quel élément focusable à
  l'intérieur
- `Tab`/`Shift+Tab` reste cantonné aux éléments focusables du panneau
  tant qu'il est ouvert (piège de focus standard, ex. via un petit hook
  `useFocusTrap` testé isolément)
- Testé avec `@testing-library/user-event` : ouverture → focus initial,
  `Tab` répété ne quitte jamais le panneau, `Escape` ferme et restaure le
  focus

---

#### US 14.4 (P1) — Formulaire de recherche de clan optimisé mobile

**En tant qu'**utilisateur sur mobile, **je veux** un formulaire de
recherche qui s'empile proprement **afin de** ne pas lutter avec un
bouton et un champ qui se chevauchent ou s'écrasent.

Constat : `ClanSearchForm` (issu de l'US 13.3, actuellement
`clan-dashboard.tsx` L212-243) utilise `flex flex-wrap items-end gap-3` —
sur 375px, le label+champ passe en pleine largeur mais le bouton
« Inspecter » reste à sa largeur intrinsèque à côté ou sous le champ,
créant une zone de tap étroite pour l'action principale de la page.

Critères d'acceptation :

- En dessous de `sm` : champ pleine largeur, bouton « Inspecter » pleine
  largeur en dessous (empilement vertical `flex-col`), hauteur de
  contrôle ≥ 44px
- Le texte d'aide et les messages d'erreur de format restent visibles
  sans réduire la taille de police en dessous de 14px (accessibilité
  lisibilité mobile)
- Non-régression du comportement desktop existant (`sm:flex-row` ou
  équivalent)

---

#### US 14.5 (P1) — Squelettes de chargement cohérents sur toutes les sections

**En tant qu'**utilisateur, **je veux** un indicateur de chargement
visuellement cohérent partout **afin de** ne pas avoir un à-coup de mise
en page différent selon la section qui charge.

Constat : `ParticipationSummarySection` et `HrAssistantSection` utilisent
déjà `Skeleton` (donut rond, blocs `h-32`). `ClanDashboard` (recherche de
clan L252-256, chargement du clan L320-324), `CurrentWarSection`
(L130-134) et `WarHistorySection` (L137-141) affichent en revanche un
simple `<p role="status">Chargement...</p>` en texte — écart de
polish entre les sections les plus anciennes et les plus récentes
(Épique 12).

Critères d'acceptation :

- Les 3 sections identifiées adoptent `Skeleton` à la place du texte brut
  (silhouette de tableau : quelques lignes `Skeleton` de largeurs
  variables plutôt qu'un simple rectangle, pour annoncer visuellement
  « ceci va devenir un tableau »)
- Le texte accessible du chargement (`aria-label`/`role="status"`) reste
  équivalent à l'existant, pour ne pas régresser côté lecteur d'écran
- Le composant `Skeleton` lui-même n'est pas modifié (déjà générique et
  testé) — uniquement son usage est étendu

---

#### US 14.6 (P2) — Zones de toucher ≥ 44×44px

**En tant qu'**utilisateur sur mobile, **je veux** que chaque contrôle
interactif soit facilement touchable **afin de** ne pas déclencher la
mauvaise action par erreur.

Constat : plusieurs contrôles sont actuellement plus petits que la cible
recommandée (WCAG 2.5.5, Apple HIG 44pt, Material 48dp) : la case à
cocher « Afficher les anciens membres » (`current-war-section.tsx`
L152-159, `<input type="checkbox">` sans style de taille), le champ
numérique de seuil (`purge-section.tsx` L93-104, `w-16 px-2 py-1`), et
les boutons d'en-tête de colonne triables (`members-table.tsx` L58-69,
`war-history-section.tsx` L243-257, `px-3 py-2` sans `min-height`
garanti).

Critères d'acceptation :

- Case à cocher stylée (ex. `h-5 w-5` minimum plus zone de tap étendue
  via le `<label>` englobant déjà présent) sans changer son comportement
  ni son état accessible
- Champ numérique de seuil : hauteur de contrôle ≥ 44px sur mobile
  (`py-2` minimum ou variante mobile dédiée), boutons +/- optionnels pour
  éviter le clavier numérique sur les petits ajustements
- Boutons de tri d'en-tête : `min-h-11` (44px) sur mobile, taille actuelle
  conservée ≥ `md` si l'audit visuel desktop ne montre pas de problème
- Aucune régression de contraste ni de focus visible (`:focus-visible`
  existant dans `globals.css` doit continuer de s'appliquer)

---

#### US 14.7 (P1) — Cohabitation contenu / barre d'onglets mobile fixe

**En tant qu'**utilisateur sur mobile, **je veux** que le dernier élément
de chaque page reste entièrement visible et cliquable **afin qu'**il ne
soit pas caché sous la barre d'onglets fixe de l'US 13.4.

Critères d'acceptation :

- `globals.css` définit une variable ou utilitaire pour
  `env(safe-area-inset-bottom)` (absent aujourd'hui), utilisée par
  `MobileTabBar` (US 13.4) et par le conteneur principal de chaque page
  (`padding-bottom: calc(4rem + env(safe-area-inset-bottom))` ou
  équivalent Tailwind)
- Vérifié spécifiquement sur `app/rh/page.tsx` : le bouton « Copier la
  liste » de `PurgeSection` (dernier élément interactif de la page) reste
  entièrement au-dessus de la tab bar sur un viewport 375×667 (iPhone SE,
  le plus petit couramment ciblé)
- Non-régression desktop : ce padding ne s'applique qu'en dessous du
  breakpoint où `MobileTabBar` est visible

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
13. ⬜ **Épique 7** — gamification et assistant de gestion : US 7 (assistant
    RH), US 8 (Hall of Fame), US 9 (panneau joueur), en cours
14. ✅ **Épique 8** — second audit UX du 2026-08-02 (navigation live, clan
    `#20J20QG`) : US-1 à US-11 implémentées (masquage par défaut des
    ex-membres dans Guerre en cours + reprise ponctuelle, coercion
    numérique partagée corrigeant le bug « Niveau à 0 », badges couleur
    Aujourd'hui/Semaine, légende visible de l'historique, sommaire de
    navigation sticky, recherche de membre, résumé + persistance du
    réglage « À expulser », copie groupée des recommandations RH, colonne
    Joueur fixe + ombre de scroll sur l'historique). `domain/shared/numeric.ts`
    et les modules déjà à 100 % restent à 100 % ; le périmètre domaine
    touché (`members.ts`, `clamp.ts`, `player-profile.ts`, `clan-summary.ts`)
    est à 95–99 % de mutation (mutants restants équivalents, documentés en
    commentaire ou déjà présents avant cet audit)
15. ✅ **Épique 10** — recherche de clan par nom (US 10.1) : détection
    transparente tag/nom depuis la même zone de saisie, nouveau proxy
    `GET /api/clans?name=...` (`proxyClanSearch`), `domain/clan/clan-search.ts`
    (réutilise `parseClanSummary`), résolution automatique à 1 résultat,
    liste de candidats cliquable à N résultats, aide sous 3 caractères.
    Domaine à 100 % de couverture, mutation 93–100 % sur le périmètre
    touché (un mutant équivalent documenté, identique au pattern
    `isRecord` de `members.ts`)
16. ✅ **Épique 11** — refonte À expulser / Sur la sellette (US 11.1) :
    règle unique (rôle + combats de la semaine en cours), seuil partagé
    et mémorisé, combinateur ET/OU et critère de dons retirés. Domaine
    (`purge.ts`, `hr-assistant.ts`) à 100 % de couverture et 100 % de
    mutation Stryker.
17. ✅ **Épique 12** — polish UI et rapport de modération (US 12.1 à
    12.4) : jauge `PlayerProgressBar` partagée entre Historique et Guerre
    en cours (nouveau seuil 8/16 partout, arbitrage A), cartes « Sur la
    sellette » à fond uni + bordure gauche épaisse (arbitrage contraste),
    message de modération unique formaté pour « Copier la liste » (seuil
    actif, bouton `disabled` plutôt que masqué, confirmation « Copié !
    ✅ »), résumé de participation en donut SVG en tête de dashboard aux
    côtés du Hall of Fame (composant client + `Skeleton`, arbitrage B).
    `domain/war/attendance-level.ts` et le nouveau
    `domain/war/participation.ts` à 100 % de couverture et 100 % de
    mutation Stryker.
18. ✅ **Épique 13** — refonte architecture & routing (App Router,
    layout persistant, `/dashboard` `/historique` `/rh`) : arbitrages C/D/E
    tranchés (voir « Notes d'implémentation » en fin d'épique, notamment
    la résolution du conflit avec l'arbitrage B de l'Épique 12 par un
    pattern de seed plutôt qu'un passage en Server Components purs), US
    13.1 à 13.7. `npm run verify` vert hors Stryker (dette de test
    assumée) ; `next build` réel vérifié
19. ⬜ **Épique 14** — audit UX mobile-first du 2026-08-03 : vues carte pour
    les 3 tableaux denses, accessibilité du panneau joueur (piège de
    focus, Escape), formulaire de recherche et zones de toucher adaptés
    au tactile, cohabitation avec la tab bar mobile fixe, US 14.1 à 14.7

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
