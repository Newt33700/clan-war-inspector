/**
 * Silhouette affichee par les `loading.tsx` de route (Dashboard,
 * Historique, RH, Nouveaux membres, Meteo) pendant que le Server Component
 * de la page resout le clan actif et interroge Supercell (US 13.2/13.6).
 *
 * Sans ce fallback, changer de clan depuis `ClanSearchForm` (qui navigue
 * vers la meme page avec un nouveau `?clan=`) laissait la page vide le
 * temps de la reponse Supercell -- silencieux au point de sembler fige,
 * au lieu du skeleton deja utilise partout ailleurs pendant un chargement
 * (US 14.5).
 */

import { Skeleton } from './skeleton';

export function RouteLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement du clan">
      <Skeleton className="h-8 w-56" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-5/6" />
    </div>
  );
}
