/**
 * Persistance du seuil d'activite hebdomadaire (regle produit du
 * 2026-08-02) : partage entre la vue "A expulser" (role `member`) et
 * "Sur la sellette" (role `elder`) de l'Assistant RH, toutes deux basees
 * sur le meme critere (combats sur la semaine de guerre en cours). Le
 * seuil repartait a sa valeur par defaut a chaque rechargement, obligeant
 * le chef de clan a le reconfigurer a chaque visite. Tolerant comme
 * `clan-tag-storage.ts` : en cas d'echec de stockage, on se comporte
 * comme sans memoire.
 */

const STORAGE_KEY = 'clan-war-inspector:purge-settings';

export interface PurgeSettings {
  minWeeklyBattles: number;
}

/** Lit le reglage memorise, `null` si absent ou invalide. */
export function readStoredPurgeSettings(): PurgeSettings | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('minWeeklyBattles' in parsed)
    ) {
      return null;
    }
    const { minWeeklyBattles } = parsed as Record<string, unknown>;
    if (
      typeof minWeeklyBattles !== 'number' ||
      !Number.isFinite(minWeeklyBattles) ||
      minWeeklyBattles < 0
    ) {
      return null;
    }
    return { minWeeklyBattles };
  } catch {
    return null;
  }
}

/** Memorise le reglage ; silencieux si le stockage est indisponible. */
export function storePurgeSettings(settings: PurgeSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Navigation privee ou stockage plein : tant pis pour la memoire.
  }
}
