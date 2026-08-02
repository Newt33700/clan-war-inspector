/**
 * Persistance du reglage de la vue "A expulser" (audit UX du 2026-08-02,
 * US-9) : le seuil et le combinateur ET/OU repartaient a leurs valeurs par
 * defaut a chaque rechargement, obligeant le chef de clan a les
 * reconfigurer a chaque visite. Tolerant comme `clan-tag-storage.ts` :
 * en cas d'echec de stockage, on se comporte comme sans memoire.
 */

import type { PurgeCombinator } from '@/domain/clan/purge';

const STORAGE_KEY = 'clan-war-inspector:purge-settings';

export interface PurgeSettings {
  minWarBattles: number;
  combinator: PurgeCombinator;
}

function isPurgeCombinator(value: unknown): value is PurgeCombinator {
  return value === 'AND' || value === 'OR';
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
      !('minWarBattles' in parsed) ||
      !('combinator' in parsed)
    ) {
      return null;
    }
    const { minWarBattles, combinator } = parsed as Record<string, unknown>;
    if (
      typeof minWarBattles !== 'number' ||
      !Number.isFinite(minWarBattles) ||
      minWarBattles < 0 ||
      !isPurgeCombinator(combinator)
    ) {
      return null;
    }
    return { minWarBattles, combinator };
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
