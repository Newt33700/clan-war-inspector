'use client';

/**
 * Inspection profonde "a la demande" (US 9) : panneau lateral qui glisse
 * depuis la droite, sans jamais quitter le tableau de bord (SPA fluide,
 * directive UX generale de l'Epique 7).
 */

import { ROLE_LABELS } from '@/domain/clan/members';
import type { PlayerProfile } from '@/domain/player/player-profile';
import { usePlayerProfile } from '@/hooks/use-player-profile';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';

interface PlayerDrawerProps {
  /** Tag du joueur a inspecter, `null` = panneau ferme. */
  tag: string | null;
  onClose: () => void;
}

function CardsGrid({ deck }: { deck: PlayerProfile['deck'] }) {
  if (deck.length === 0) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
            <rect x="6" y="2" width="12" height="18" rx="2" />
          </svg>
        }
        title="Deck indisponible"
        description="Ni deck actuel ni carte favorite dans ce profil."
      />
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {deck.map((card, index) => (
        <div
          key={`${card.name}-${index}`}
          data-testid="deck-card"
          className="bg-royale-navy-900 flex flex-col items-center gap-1 rounded p-1"
        >
          {card.iconUrl.length > 0 ? (
            <img
              src={card.iconUrl}
              alt={card.name}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <div className="bg-royale-blue-800 h-10 w-10 rounded" aria-hidden="true" />
          )}
          <span className="text-royale-parchment-dim w-full truncate text-center text-[10px]">
            {card.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="mt-6 space-y-4" data-testid="drawer-skeleton">
      <Skeleton className="h-6 w-40" label="Chargement du profil joueur" />
      <Skeleton className="h-3 w-24" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

function ProfileContent({ profile }: { profile: PlayerProfile }) {
  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="text-royale-parchment font-display text-lg">{profile.name}</p>
        <p className="text-royale-parchment-dim text-xs">{profile.tag}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-royale-parchment-dim text-xs uppercase">Role</dt>
          <dd className="text-royale-parchment font-semibold">
            {profile.role !== null ? ROLE_LABELS[profile.role] : 'Hors clan'}
          </dd>
        </div>
        <div>
          <dt className="text-royale-parchment-dim text-xs uppercase">Niveau</dt>
          <dd className="text-royale-parchment font-semibold">{profile.expLevel}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-royale-parchment-dim text-xs uppercase">Total de dons</dt>
          <dd className="text-royale-parchment font-semibold">{profile.donations}</dd>
        </div>
      </dl>

      <div>
        <h3 className="text-royale-parchment-dim mb-2 text-xs uppercase">Deck</h3>
        <CardsGrid deck={profile.deck} />
      </div>
    </div>
  );
}

export function PlayerDrawer({ tag, onClose }: PlayerDrawerProps) {
  const isOpen = tag !== null;
  const resource = usePlayerProfile(tag);

  return (
    <>
      <div
        data-testid="player-drawer-overlay"
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-hidden={!isOpen}
        aria-labelledby="player-drawer-title"
        className={`bg-royale-navy-950 border-royale-blue-800 fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l p-6 shadow-xl transition-transform duration-300 sm:w-[400px] ${
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2
            id="player-drawer-title"
            className="text-royale-parchment font-display text-lg tracking-wide"
          >
            Profil joueur
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="text-royale-parchment-dim hover:text-royale-parchment text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {resource.status === 'loading' && <DrawerSkeleton />}
        {resource.status === 'error' && (
          <p role="alert" className="text-royale-red-500 mt-6">
            {resource.message}
          </p>
        )}
        {resource.status === 'success' && <ProfileContent profile={resource.profile} />}
      </aside>
    </>
  );
}
