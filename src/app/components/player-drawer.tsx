'use client';

/**
 * Inspection profonde "a la demande" (US 9) : panneau lateral qui glisse
 * depuis la droite, sans jamais quitter le tableau de bord (SPA fluide,
 * directive UX generale de l'Epique 7).
 */

import type { PlayerProfile } from '@/domain/player/player-profile';
import { summarizeCardsByLevel } from '@/domain/player/card-collection';
import { averageElixirCost } from '@/domain/player/deck-stats';
import type { RecentBattle } from '@/domain/player/battle-log';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { usePlayerProfile } from '@/hooks/use-player-profile';
import { usePlayerBattlelog } from '@/hooks/use-player-battlelog';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { SwordsIcon } from './section-icons';
import { useTranslations } from './i18n/locale-provider';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

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
          <span
            data-testid="deck-card-level"
            className="text-royale-blue-800 text-[10px] font-semibold tabular-nums"
          >
            {t('playerDrawer.cardLevel', { level: card.level })}
          </span>
        </div>
      ))}
    </div>
  );
}

function CardCollection({ cards, t }: { cards: PlayerProfile['cards']; t: Translate }) {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
            <rect x="6" y="2" width="12" height="18" rx="2" />
          </svg>
        }
        title={t('playerDrawer.cardCollectionUnavailableTitle')}
        description={t('playerDrawer.cardCollectionUnavailableDescription')}
        tone="light"
      />
    );
  }

  const breakdown = summarizeCardsByLevel(cards);
  const maxCount = Math.max(...breakdown.map((entry) => entry.count));

  return (
    <div className="space-y-3">
      <p data-testid="cards-obtained-total" className="font-semibold text-slate-900">
        {t('playerDrawer.cardsObtained', { count: cards.length })}
      </p>
      <ul className="space-y-1.5">
        {breakdown.map((entry) => (
          <li
            key={entry.level}
            data-testid="card-level-row"
            className="flex items-center gap-2 text-xs"
          >
            <span className="w-20 shrink-0 font-semibold text-slate-700">
              {t('playerDrawer.cardLevelRow', { level: entry.level })}
            </span>
            <span
              aria-hidden="true"
              className="bg-royale-navy-950 relative h-2.5 flex-1 overflow-hidden rounded-sm border border-black"
            >
              <span
                className="bg-royale-gold-400 block h-full"
                style={{ width: `${(entry.count / maxCount) * 100}%` }}
              />
            </span>
            <span className="w-6 shrink-0 text-right text-slate-500 tabular-nums">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BATTLE_RESULT_CLASSES: Record<RecentBattle['result'], string> = {
  win: 'bg-royale-green-500',
  loss: 'bg-royale-red-500',
  draw: 'bg-slate-400',
};

/** Jamais la couleur seule (contrainte accessibilite, cf. US 6.8/12.1) : symbole + libelle. */
const BATTLE_RESULT_SYMBOLS: Record<RecentBattle['result'], string> = {
  win: '✓',
  loss: '✗',
  draw: '–',
};

const BATTLE_RESULT_LABEL_KEYS: Record<RecentBattle['result'], string> = {
  win: 'playerDrawer.battleResultWin',
  loss: 'playerDrawer.battleResultLoss',
  draw: 'playerDrawer.battleResultDraw',
};

function RecentBattlesUnavailable({ t }: { t: Translate }) {
  return (
    <EmptyState
      icon={<SwordsIcon className="h-8 w-8" />}
      title={t('playerDrawer.recentBattlesUnavailableTitle')}
      description={t('playerDrawer.recentBattlesUnavailableDescription')}
      tone="light"
    />
  );
}

function RecentBattles({ tag, t }: { tag: string; t: Translate }) {
  const resource = usePlayerBattlelog(tag);

  if (resource.status === 'loading' || resource.status === 'idle') {
    return (
      <div className="flex flex-wrap gap-1" data-testid="recent-battles-skeleton">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-6 w-6" />
        ))}
      </div>
    );
  }

  if (resource.status === 'error') {
    return <RecentBattlesUnavailable t={t} />;
  }

  if (resource.battles.length === 0) {
    return <RecentBattlesUnavailable t={t} />;
  }

  const wins = resource.battles.filter((battle) => battle.result === 'win').length;
  const losses = resource.battles.filter((battle) => battle.result === 'loss').length;
  const draws = resource.battles.filter((battle) => battle.result === 'draw').length;

  return (
    <div className="space-y-2">
      <p
        data-testid="recent-battles-summary"
        className="text-xs font-semibold text-slate-700"
      >
        {t('playerDrawer.recentBattlesSummary', { wins, losses, draws })}
      </p>
      <ul className="flex flex-wrap gap-1">
        {resource.battles.map((battle, index) => (
          <li
            key={index}
            data-testid="recent-battle-cell"
            aria-label={t(BATTLE_RESULT_LABEL_KEYS[battle.result])}
            className={`flex h-6 w-6 items-center justify-center rounded-sm border border-black text-[10px] font-bold text-white ${BATTLE_RESULT_CLASSES[battle.result]}`}
          >
            <span aria-hidden="true">{BATTLE_RESULT_SYMBOLS[battle.result]}</span>
          </li>
        ))}
      </ul>
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
          {t('playerDrawer.careerStatsTitle')}
        </h3>
        <dl className="grid grid-cols-2 gap-3 text-sm" data-testid="career-stats">
          <div>
            <dt className="text-xs text-slate-500 uppercase">
              {t('playerDrawer.careerWins')}
            </dt>
            <dd className="font-semibold text-slate-900">{profile.wins}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase">
              {t('playerDrawer.careerLosses')}
            </dt>
            <dd className="font-semibold text-slate-900">{profile.losses}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase">
              {t('playerDrawer.careerBattlesPlayed')}
            </dt>
            <dd className="font-semibold text-slate-900">{profile.battleCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase">
              {t('playerDrawer.careerThreeCrownWins')}
            </dt>
            <dd className="font-semibold text-slate-900">{profile.threeCrownWins}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500 uppercase">
              {t('playerDrawer.careerTotalDonations')}
            </dt>
            <dd className="font-semibold text-slate-900">{profile.totalDonations}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="mb-2 flex items-baseline justify-between text-xs text-slate-500 uppercase">
          <span>{t('playerDrawer.deck')}</span>
          {profile.deck.length > 0 && (
            <span
              data-testid="deck-average-elixir"
              className="text-royale-blue-800 normal-case"
            >
              {t('playerDrawer.deckAverageElixir', {
                average: averageElixirCost(profile.deck),
              })}
            </span>
          )}
        </h3>
        <CardsGrid deck={profile.deck} t={t} />
      </div>

      <div>
        <h3 className="mb-2 text-xs text-slate-500 uppercase">
          {t('playerDrawer.cardCollectionTitle')}
        </h3>
        <CardCollection cards={profile.cards} t={t} />
      </div>

      <div>
        <h3 className="mb-2 text-xs text-slate-500 uppercase">
          {t('playerDrawer.recentBattlesTitle')}
        </h3>
        <RecentBattles tag={profile.tag} t={t} />
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
