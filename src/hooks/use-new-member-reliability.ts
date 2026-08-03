'use client';

/**
 * Enrichissement des nouveaux membres (US 11, "Sas de Quarantaine") :
 * appelle /api/players/{tag} un par un, jamais en parallele, pour eviter
 * un pic de requetes vers l'API Supercell (jusqu'a une dizaine de
 * nouveaux membres a la fois, risque de 429). Chaque profil bascule de
 * "loading" a son resultat des qu'il arrive, sans attendre les tags
 * suivants de la liste (contrairement a un simple `Promise.all`).
 */

import { useEffect, useState } from 'react';
import { toApiPlayerTagSegment } from '@/domain/clan/player-tag';
import {
  parsePlayerReliabilityStats,
  type PlayerReliabilityStats,
} from '@/domain/player/reliability';
import { readApiErrorMessage } from './use-api-resource';

export type ReliabilityResource =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; stats: PlayerReliabilityStats };

const INVALID_TAG_STATE: ReliabilityResource = {
  status: 'error',
  message: 'Tag joueur invalide.',
};
const UNREADABLE_PROFILE_STATE: ReliabilityResource = {
  status: 'error',
  message: 'Profil joueur illisible.',
};
const NETWORK_ERROR_STATE: ReliabilityResource = {
  status: 'error',
  message: 'Impossible de joindre le serveur.',
};

async function fetchOne(tag: string, signal: AbortSignal): Promise<ReliabilityResource> {
  const segment = toApiPlayerTagSegment(tag);
  if (segment === null) {
    return INVALID_TAG_STATE;
  }
  const response = await fetch(new URL(`/api/players/${segment}`, window.location.href), {
    signal,
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    return { status: 'error', message: readApiErrorMessage(payload, response.status) };
  }
  const stats = parsePlayerReliabilityStats(payload);
  return stats === null ? UNREADABLE_PROFILE_STATE : { status: 'success', stats };
}

/**
 * Enrichit `tags` un par un (jamais en parallele) via /api/players/{tag}.
 * Changer la liste (nouvelle recherche de clan, nouveaux membres detectes)
 * relance l'enrichissement depuis le debut.
 */
export function useNewMemberReliability(
  tags: readonly string[],
): ReadonlyMap<string, ReliabilityResource> {
  const [resources, setResources] = useState<Map<string, ReliabilityResource>>(new Map());
  // Cle stable derivee du contenu (pas de la reference du tableau) : un
  // appelant qui reconstruit `tags` a chaque rendu (tableau litteral, pas
  // de `useMemo`) ne doit jamais relancer l'enrichissement en boucle. `|`
  // est un separateur sur : l'alphabet des tags Supercell ne le contient
  // pas (`CLAN_TAG_ALLOWED_CHARACTERS`), donc aucune collision possible.
  const tagsKey = tags.join('|');

  useEffect(() => {
    // `''.split('|')` vaudrait `['']` (un tag fantome), d'ou ce garde :
    // une liste vide doit rester une liste vide. Au-dela, une liste
    // effectivement vide n'a besoin d'aucun autre traitement particulier
    // (map vide, boucle a 0 iteration, controller inerte) : pas de
    // retour anticipe distinct, redondant avec le reste de la fonction.
    const currentTags = tagsKey.length === 0 ? [] : tagsKey.split('|');
    const controller = new AbortController();
    setResources(new Map(currentTags.map((tag) => [tag, { status: 'loading' }])));

    void (async () => {
      for (const tag of currentTags) {
        let result: ReliabilityResource;
        try {
          result = await fetchOne(tag, controller.signal);
        } catch {
          // L'API Fetch rejette systematiquement une requete dont le
          // signal est aborte (changement de tags ou demontage) : c'est
          // le seul chemin observable d'une annulation, jamais un succes
          // tardif a ecarter apres coup. Une vraie panne reseau (signal
          // toujours actif) devient une erreur pour ce seul tag, sans
          // bloquer les suivants.
          if (controller.signal.aborted) {
            return;
          }
          result = NETWORK_ERROR_STATE;
        }
        setResources((current) => new Map(current).set(tag, result));
      }
    })();

    return () => {
      controller.abort();
    };
  }, [tagsKey]);

  return resources;
}
