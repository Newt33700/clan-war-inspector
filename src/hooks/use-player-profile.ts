'use client';

/**
 * Chargement du profil joueur "a la demande" (US 9).
 *
 * Anti-spam : aucun appel reseau tant que `tag` est `null` (le panneau est
 * ferme). Memoisation : un `Map` persistant (ref, pas de state) garde le
 * resultat de chaque tag deja consulte ; rouvrir le meme joueur ne refait
 * jamais l'appel, meme apres fermeture du panneau.
 */

import { useEffect, useRef, useState } from 'react';
import { toApiPlayerTagSegment } from '@/domain/clan/player-tag';
import { parsePlayerProfile, type PlayerProfile } from '@/domain/player/player-profile';
import { readApiErrorMessage } from './use-api-resource';

export type PlayerProfileResource =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; profile: PlayerProfile };

const INVALID_TAG_STATE: PlayerProfileResource = {
  status: 'error',
  message: 'Tag joueur invalide.',
};
const UNREADABLE_PROFILE_STATE: PlayerProfileResource = {
  status: 'error',
  message: 'Profil joueur illisible.',
};
const NETWORK_ERROR_STATE: PlayerProfileResource = {
  status: 'error',
  message: 'Impossible de joindre le serveur.',
};

/** `tag === null` met le hook au repos, sans jamais appeler l'API. */
export function usePlayerProfile(tag: string | null): PlayerProfileResource {
  const cache = useRef(new Map<string, PlayerProfileResource>());
  const [state, setState] = useState<PlayerProfileResource>({ status: 'idle' });

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
          new URL(`/api/players/${segment}`, window.location.href),
          { signal: controller.signal },
        );
        const payload: unknown = await response.json();
        if (!response.ok) {
          const errorState: PlayerProfileResource = {
            status: 'error',
            message: readApiErrorMessage(payload, response.status),
          };
          cache.current.set(tag, errorState);
          setState(errorState);
          return;
        }

        const profile = parsePlayerProfile(payload);
        const result: PlayerProfileResource =
          profile === null ? UNREADABLE_PROFILE_STATE : { status: 'success', profile };
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
