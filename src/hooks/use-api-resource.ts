'use client';

/**
 * Hook generique de chargement d'une ressource du proxy API (US 3.1).
 * Dans le perimetre Stryker : la machine a etats et l'extraction du
 * message d'erreur sont verrouillees par les tests.
 */

import { useEffect, useState } from 'react';

export type ApiResourceState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

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
 */
export function useApiResource<T>(path: string | null): ApiResourceState<T> {
  const [state, setState] = useState<ApiResourceState<T>>({ status: 'idle' });

  useEffect(() => {
    if (path === null) {
      setState({ status: 'idle' });
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
  }, [path]);

  return state;
}
