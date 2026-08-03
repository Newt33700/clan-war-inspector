'use client';

/**
 * Etat idle/loading/error du clan (US 13.6, Epique 13), factorise entre
 * `DashboardView`, `HistoriqueView` et `RhView` : les 3 vues attendent le
 * meme clan avant d'afficher leur contenu propre, avec le meme message de
 * reprise apres erreur (US 6.3). Ne rend rien une fois le clan charge :
 * chaque vue reste seule responsable de son propre contenu de succes.
 */

import type { ApiResource } from '@/hooks/use-api-resource';

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
    return (
      <p role="status" className="text-royale-parchment-dim">
        Chargement du clan...
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p role="alert" className="text-royale-red-500">
        {state.message}
      </p>
      <button
        type="button"
        onClick={state.refetch}
        className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold"
      >
        Reessayer
      </button>
    </div>
  );
}
