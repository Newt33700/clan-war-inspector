# CLAUDE.md

Consignes pour les agents qui travaillent sur ce depot. Le `README.md` decrit le produit
et son deploiement ; ce fichier decrit **comment on travaille ici**, et surtout **pourquoi**
certaines choses sont faites d'une facon qui peut surprendre.

## Le projet en trois lignes

Dashboard Clash Royale (Next.js App Router, aucune base de donnees) qui repond a une
question : qui a joue ses 16 combats de guerre cette semaine ? Les donnees viennent de
l'API Supercell via un Route Handler qui sert de proxy et garde la cle cote serveur.

## Regle d'architecture non negociable

La dependance est a sens unique : `app/` peut importer `domain/`, **jamais l'inverse**.
`src/domain/` est de la logique metier pure — aucun import React, aucun `fetch`, aucun
acces au DOM. Ce n'est pas un gout esthetique : c'est ce qui permet de tester le coeur du
produit sans navigateur ni reseau, et c'est la base de toute la performance de la CI
(section suivante). Faire entrer React ou le DOM dans `src/domain/` obligerait a rebasculer
le mutation testing du domaine sur jsdom, et rendrait la CI plusieurs fois plus lente.

## Commandes

| Commande                       | Role                                                    |
| ------------------------------ | ------------------------------------------------------- |
| `npm run verify`               | Tout : format, lint, types, couverture, mutation        |
| `npm test`                     | Tests unitaires (Vitest)                                |
| `npm run test:coverage`        | Tests + couverture, **echoue sous les seuils**          |
| `npm run test:mutation`        | Mutation testing complet, **echoue sous 90 %**          |
| `npm run test:mutation:verify` | Verifie que tout fichier a muter est bien dans un scope |

Une US n'est terminee que quand `npm run verify` passe en local. TDD : le test echoue
d'abord, le code le fait passer, le refactoring vient ensuite.

## Mutation testing : l'architecture a comprendre avant d'y toucher

C'est le point le plus contre-intuitif du depot. Lisez cette section **avant** de modifier
`stryker.config.json`, `vitest.mutation.config.ts` ou `scripts/mutation*.mjs`.

### Le probleme resolu

Stryker rejoue, pour **chaque mutant**, tous les tests qui couvrent la ligne mutee. Avec
une configuration Vitest unique, un mutant de `src/domain` etait verifie par ~16 tests —
parce qu'une vingtaine de composants et de vues importent le domaine, donc leurs tests de
rendu le couvrent aussi. Et chaque execution d'un fichier de test repaie le `setupFiles`,
soit ~400 ms, contre ~2 ms pour les assertions du domaine elles-memes.

Resultat : le mutation testing pesait **15 min 48 s sur les 17 min 18 s de CI (91 %)**.
Le cout n'etait pas le nombre de mutants, mais le nombre de tests rejoues par mutant.

### La solution

Chaque perimetre de mutation est appaire avec **les seuls tests qui le concernent**, dans
**l'environnement minimal qui lui suffit** (`vitest.mutation.config.ts`, selectionne par la
variable `STRYKER_SCOPE`) :

| Scope    | Fichiers mutes   | Tests joues                | Environnement           |
| -------- | ---------------- | -------------------------- | ----------------------- |
| `domain` | `src/domain/**`  | `src/domain/**/*.test.ts`  | `node`, **aucun setup** |
| `api`    | `src/app/api/**` | `src/app/api/**/*.test.ts` | `node` + MSW            |
| `hooks`  | `src/hooks/**`   | `src/hooks/**/*.test.*`    | `jsdom` + MSW           |

Mesure : moyenne passee de 16 a ~3 tests par mutant, dry run du domaine de 31 s a 4 s,
mutation sequentielle de **948 s a 212 s**. En CI les scopes sont repartis sur 5 jobs
paralleles (shards), le plus long tient en 77 s.

C'est aussi plus exigeant sur le fond : un mutant du domaine doit maintenant etre tue par
un **test unitaire du domaine**, pas incidemment par un rendu de composant.

### Le seuil est global, pas par shard

`thresholds.break` est volontairement a `null` dans `stryker.config.json`. Le score d'un
shard isole n'est pas celui du projet : un petit shard peut legitimement etre sous la
moyenne. `scripts/mutation-report.mjs` fusionne les rapports et applique les 90 % **une
seule fois, sur l'union**. Ne remettez pas un `break` par shard : vous obtiendriez des
echecs qui n'en sont pas.

### Ce que vous devez faire selon la situation

- **Vous ajoutez un fichier dans un repertoire deja couvert** (`src/domain/war/…`) :
  rien a faire. Le decoupage en shards est recalcule a partir des fichiers presents.
- **Vous ajoutez un nouveau repertoire de code metier** : declarez-le dans
  `SCOPES` (`scripts/mutation-scopes.mjs`), dans `mutate` (`stryker.config.json`), et
  donnez-lui son perimetre de tests dans `vitest.mutation.config.ts`. Sinon
  `npm run test:mutation:verify` echoue en CI — c'est voulu, sans ce garde-fou un
  repertoire entier ne serait jamais mute et la CI resterait verte en silence.
- **Un mutant du domaine survit alors qu'un test de composant le tuait avant** : ecrivez
  le test unitaire du domaine qui manque. Ne rebasculez pas le scope `domain` sur jsdom
  ou sur tous les tests : vous rendriez la CI 7 fois plus lente pour masquer un trou de
  test reel.
- **Un test du domaine a besoin du DOM ou de MSW** : c'est le signe qu'il ne teste pas du
  domaine. Deplacez le code teste vers `hooks/` ou `app/`. Attention au mode d'echec : le
  scope `domain` tourne sans jsdom ni MSW, donc un besoin de DOM echoue franchement
  (`document` non defini), mais un `fetch` non mocke **partira reellement sur le reseau**
  au lieu d'etre intercepte. Un test du domaine qui appelle le reseau est un bug.

### Garde-fous en place

Deux verifications existent parce que « plus rapide » ne doit pas vouloir dire « moins
sur ». Ne les retirez pas :

1. `--verify` echoue si un fichier du `mutate` de reference echappe aux scopes.
2. Chaque shard ecrit un manifeste des fichiers qu'il devait traiter ; la porte echoue si
   un shard manque a l'appel. Sans ca, un job annule ou un artefact perdu donnerait un
   score calcule sur une partie du code seulement, et la CI passerait au vert.

## Si vous optimisez la CI

La lecon de la passe precedente : **profilez avant de paralleliser**. Le reflexe naturel
etait « ajoutons des shards » ; le vrai probleme etait 16 tests rejoues par mutant, et le
sharding seul n'aurait fait que repartir du gaspillage sur plus de machines.

Dans l'ordre :

1. Lisez les durees reelles par etape (`actions_list` → `list_workflow_jobs` donne le
   `started_at`/`completed_at` de chaque step). Ne devinez pas ou va le temps.
2. Pour Stryker, la ligne qui compte dans les logs est
   `Ran N tests per mutant on average` et le temps du `Initial test run`. Ce sont les deux
   leviers, avant tout parallelisme.
3. Mesurez avant/apres sur une machine a 4 vCPU (c'est ce que donne `ubuntu-latest` sur
   ce depot public) et citez les chiffres dans le message de commit.

Ajouter un shard, c'est ajouter une ligne dans la matrice de `.github/workflows/ci.yml` :
le decoupage des fichiers suit tout seul.

## Points ouverts connus

- `src/lib/**` et `src/i18n/**` contiennent de la logique testee mais **absente du
  perimetre de mutation**. C'est un choix pre-existant, pas un oubli du script. Les
  ajouter coutera du temps de CI : a arbitrer avec le proprietaire du depot.
- Le shard `hooks-1` (~77 s) est deux fois plus long que `hooks-2` (~44 s). La repartition
  par taille de fichier est pourtant equilibree : `use-api-resource.ts` est intrinsequement
  couteux a muter. Le decouper davantage ne gagnerait rien, il finirait seul dans un shard.

## Conventions d'ecriture

- Commentaires et documentation **en francais, sans accents** (coherent avec l'existant).
- Les commentaires expliquent le _pourquoi_, pas le _quoi_ : regardez
  `src/domain/war/attendance-level.ts` pour le ton attendu (regle produit, US de
  reference, contrainte d'accessibilite).
- Prettier fait foi pour le formatage : `npm run format` avant de commiter.
