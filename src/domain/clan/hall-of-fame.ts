/**
 * "Hall of Fame" (US 8, revise le 2026-08-05) : top N par fame de la
 * semaine de guerre EN COURS -- pas la derniere semaine complete du log.
 * Retour utilisateur du clan French 4 (#QC29VC08) : la fame affichee
 * doit refleter l'etat actuel de la guerre en cours, mise a jour au fil
 * de la semaine jusqu'a la guerre suivante, pas un instantane fige de la
 * semaine precedente.
 *
 * Fonction pure operant directement sur des participants deja parses
 * (`domain/war/current-war`, qui expose desormais `fame` par joueur en
 * plus des decks joues) : plus besoin de rechercher le clan cible dans
 * un log multi-clans/multi-semaines, `/currentriverrace` est deja propre
 * a ce clan.
 */

export interface HallOfFameEntry {
  tag: string;
  name: string;
  fame: number;
}

interface FameSource {
  tag: string;
  name: string;
  fame: number;
}

const DEFAULT_TOP_N = 3;

/**
 * Classe des participants (deja deduplique par tag en amont, cf.
 * `parseCurrentWar`) par fame decroissante, depart age par nom puis tag.
 */
export function topByFame(
  participants: readonly FameSource[],
  topN: number = DEFAULT_TOP_N,
): HallOfFameEntry[] {
  return [...participants]
    .sort(
      (a, b) =>
        b.fame - a.fame || a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag),
    )
    .slice(0, topN)
    .map(({ tag, name, fame }) => ({ tag, name, fame }));
}
