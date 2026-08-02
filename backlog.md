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
