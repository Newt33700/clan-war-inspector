'use client';

/**
 * Inspection profonde "a la demande" (US 9) : panneau lateral qui glisse
 * depuis la droite, sans jamais quitter le tableau de bord (SPA fluide,
 * directive UX generale de l'Epique 7).
 */

import type { PlayerProfile } from '@/domain/player/player-profile';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { usePlayerProfile } from '@/hooks/use-player-profile';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { useTranslations } from './i18n/locale-provider';

type Translate = (key: string) => string;

interface PlayerDrawerProps {
  /** Tag du joueur a inspecter, `null` = panneau ferme. */
  tag: string | null;
  onClose: () => void;
}

function CardsGrid({ deck, t }: { deck: PlayerProfile['deck']; t: Translate }) {
  if (deck.length === 0) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
            <rect x="6" y="2" width="12" height="18" rx="2" />
          </svg>
        }
        title={t('playerDrawer.deckUnavailableTitle')}
        description={t('playerDrawer.deckUnavailableDescription')}
        tone="light"
      />
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {deck.map((card, index) => (
        <div
          key={`${card.name}-${index}`}
          data-testid="deck-card"
          className="cr-pill-row flex flex-col items-center gap-1 p-1"
        >
          {card.iconUrl.length > 0 ? (
            <img
              src={card.iconUrl}
              alt={card.name}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-slate-300" aria-hidden="true" />
          )}
          <span className="w-full truncate text-center text-[10px] text-slate-500">
            {card.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function DrawerSkeleton({ t }: { t: Translate }) {
  return (
    <div className="mt-6 space-y-4" data-testid="drawer-skeleton">
      <Skeleton className="h-6 w-40" label={t('playerDrawer.loadingLabel')} />
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

function ProfileContent({ profile, t }: { profile: PlayerProfile; t: Translate }) {
  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="font-display text-lg text-slate-900">{profile.name}</p>
        <p className="text-xs text-slate-500">{profile.tag}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500 uppercase">{t('playerDrawer.role')}</dt>
          <dd className="font-semibold text-slate-900">
            {profile.role !== null
              ? t(`roles.${profile.role}`)
              : t('playerDrawer.outOfClan')}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 uppercase">{t('playerDrawer.level')}</dt>
          <dd className="font-semibold text-slate-900">{profile.expLevel}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500 uppercase">
            {t('playerDrawer.totalDonations')}
          </dt>
          <dd className="font-semibold text-slate-900">{profile.donations}</dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-xs text-slate-500 uppercase">
          {t('playerDrawer.deck')}
        </h3>
        <CardsGrid deck={profile.deck} t={t} />
      </div>
    </div>
  );
}

export function PlayerDrawer({ tag, onClose }: PlayerDrawerProps) {
  const { t } = useTranslations();
  const isOpen = tag !== null;
  const resource = usePlayerProfile(tag);
  // Boite de dialogue modale accessible (US 14.3) : focus initial dans le
  // panneau, Tab/Shift+Tab cantonnes, Echap ferme, focus restaure sur le
  // declencheur (ligne du tableau ou carte mobile) a la fermeture.
  const containerRef = useFocusTrap<HTMLElement>(isOpen, onClose);

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
        ref={containerRef}
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-labelledby="player-drawer-title"
        tabIndex={-1}
        className={`bg-cr-panel-light fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l-2 border-black p-6 shadow-xl transition-transform duration-300 sm:w-[400px] ${
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2
            id="player-drawer-title"
            className="font-display text-lg tracking-wide text-slate-900"
          >
            {t('playerDrawer.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('playerDrawer.close')}
            className="text-xl leading-none text-slate-500 hover:text-slate-900"
          >
            &times;
          </button>
        </div>

        {resource.status === 'loading' && <DrawerSkeleton t={t} />}
        {resource.status === 'error' && (
          <p role="alert" className="text-cr-red mt-6">
            {resource.message}
          </p>
        )}
        {resource.status === 'success' && (
          <ProfileContent profile={resource.profile} t={t} />
        )}
      </aside>
    </>
  );
}
