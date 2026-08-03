'use client';

/**
 * Hook generique de chargement d'une ressource du proxy API (US 3.1).
 * Dans le perimetre Stryker : la machine a etats et l'extraction du
 * message d'erreur sont verrouillees par les tests.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type ApiResourceState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

/** Etat de la ressource, plus la capacite de relancer le chargement (US 6.3). */
export type ApiResource<T> = ApiResourceState<T> & { refetch: () => void };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

/**
 * Extrait le message stable du proxy (`{ error: { message } }`),
 * sinon retombe sur un libelle generique portant le code HTTP.
 */
export function readApiErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && isRecord(payload.error)) {
    const message = payload.error.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return `Erreur ${status}`;
}

/**
 * Charge `path` (relatif au site) et expose l'etat du cycle de vie.
 * `null` met le hook au repos ; changer de chemin relance le chargement.
 * `refetch` relance un chargement sur le meme chemin (US 6.3), utile pour
 * reessayer une ressource en erreur sans re-soumettre tout le formulaire.
 *
 * `seed` (US 13.2, Epique 13) pre-remplit l'etat avec une donnee deja
 * resolue par le Server Component de la page (fetch serveur initial) :
 * le premier rendu affiche directement ce resultat, sans etat "loading"
 * ni appel reseau redondant. Le hook reste seul maitre du cycle de vie
 * pour toute interaction ulterieure (changement de `path`, `refetch`).
 */
export function useApiResource<T>(
  path: string | null,
  seed?: ApiResourceState<T>,
): ApiResource<T> {
  // Valeur initiale sans consequence observable en l'absence de seed :
  // l'effet ci-dessous la recalcule et l'ecrase au premier rendu, que
  // path soit null ou non (mutant Stryker "equivalent" sur ce litteral).
  const [state, setState] = useState<ApiResourceState<T>>(seed ?? { status: 'idle' });
  // Seul compte le fait que la valeur change (dependance d'effet plus bas) :
  // +1 est arbitraire, -1 serait tout aussi correct (mutant Stryker
  // "equivalent" sur l'operateur arithmetique). Le tableau de dependances
  // vide de useCallback est un autre equivalent : tout litteral constant
  // (chaine, nombre...) y produirait le meme comportement, puisque seule
  // compte l'egalite de ses elements d'un rendu a l'autre.
  const [attempt, setAttempt] = useState(0);
  const refetch = useCallback(() => setAttempt((current) => current + 1), []);
  // Vrai uniquement pour le tout premier rendu quand un seed est fourni :
  // evite de relancer immediatement un fetch qui ecraserait la donnee deja
  // resolue par le serveur avec un aller-retour client redondant.
  const skipNextFetch = useRef(seed !== undefined);

  useEffect(() => {
    if (path === null) {
      setState({ status: 'idle' });
      return;
    }

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    void (async () => {
      try {
        // URL absolue : indispensable sous jsdom, transparent en navigateur.
        const response = await fetch(new URL(path, window.location.href), {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          setState({
            status: 'error',
            message: readApiErrorMessage(payload, response.status),
          });
          return;
        }
        setState({ status: 'success', data: payload as T });
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: 'error',
          message: 'Impossible de joindre le serveur.',
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [path, attempt]);

  return { ...state, refetch };
}
