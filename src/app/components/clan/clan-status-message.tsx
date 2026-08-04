'use client';

/**
 * Etat idle/loading/error du clan (US 13.6, Epique 13), factorise entre
 * `DashboardView`, `HistoriqueView` et `RhView` : les 3 vues attendent le
 * meme clan avant d'afficher leur contenu propre, avec le meme message de
 * reprise apres erreur (US 6.3). Ne rend rien une fois le clan charge :
 * chaque vue reste seule responsable de son propre contenu de succes.
 */

import type { ApiResource } from '@/hooks/use-api-resource';
import { Skeleton } from '../skeleton';

interface ClanStatusMessageProps {
  state: ApiResource<unknown>;
  /** Message affiche tant qu'aucun clan n'est actif (etat idle). */
  idleMessage: string;
}

export function ClanStatusMessage({ state, idleMessage }: ClanStatusMessageProps) {
  if (state.status === 'success') {
    return null;
  }

  if (state.status === 'idle') {
    return <p className="text-royale-parchment-dim">{idleMessage}</p>;
  }

  if (state.status === 'loading') {
    // Silhouette de l'en-tete de clan (US 14.5) plutot qu'un texte brut :
    // annonce visuellement ce qui va apparaitre, cohérent avec le reste
    // de l'app (ParticipationSummarySection, HrAssistantSection...).
    return (
      <div
        role="status"
        aria-label="Chargement du clan"
        className="flex items-center gap-4"
      >
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p role="alert" className="text-royale-red-700">
        {state.message}
      </p>
      <button type="button" onClick={state.refetch} className="btn-cr-gold px-3 py-1 text-sm">
        Reessayer
      </button>
    </div>
  );
}
