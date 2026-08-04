'use client';

/**
 * Chargement des combats recents d'un joueur (retour utilisateur 2026-08-04,
 * inspiration StatsRoyale "Combats recents"). Meme contrat que
 * `use-player-profile.ts` : anti-spam (aucun appel tant que `tag` est
 * `null`), cache en memoire par tag, jamais bloquant pour le reste du
 * panneau joueur (etat independant de `usePlayerProfile`).
 */

import { useEffect, useRef, useState } from 'react';
import { toApiPlayerTagSegment } from '@/domain/clan/player-tag';
import { parseRecentBattles, type RecentBattle } from '@/domain/player/battle-log';

export type PlayerBattlelogResource =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; battles: RecentBattle[] };

const INVALID_TAG_STATE: PlayerBattlelogResource = { status: 'error' };
const NETWORK_ERROR_STATE: PlayerBattlelogResource = { status: 'error' };

/** `tag === null` met le hook au repos, sans jamais appeler l'API. */
export function usePlayerBattlelog(tag: string | null): PlayerBattlelogResource {
  const cache = useRef(new Map<string, PlayerBattlelogResource>());
  const [state, setState] = useState<PlayerBattlelogResource>({ status: 'idle' });

  useEffect(() => {
    if (tag === null) {
      setState({ status: 'idle' });
      return;
    }

    const cached = cache.current.get(tag);
    if (cached !== undefined) {
      setState(cached);
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    void (async () => {
      const segment = toApiPlayerTagSegment(tag);
      if (segment === null) {
        cache.current.set(tag, INVALID_TAG_STATE);
        setState(INVALID_TAG_STATE);
        return;
      }

      try {
        const response = await fetch(
          new URL(`/api/players/${segment}/battlelog`, window.location.href),
          { signal: controller.signal },
        );
        if (!response.ok) {
          const errorState: PlayerBattlelogResource = { status: 'error' };
          cache.current.set(tag, errorState);
          setState(errorState);
          return;
        }

        const payload: unknown = await response.json();
        const result: PlayerBattlelogResource = {
          status: 'success',
          battles: parseRecentBattles(payload),
        };
        cache.current.set(tag, result);
        setState(result);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        cache.current.set(tag, NETWORK_ERROR_STATE);
        setState(NETWORK_ERROR_STATE);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [tag]);

  return state;
}
