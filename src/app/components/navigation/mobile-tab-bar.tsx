'use client';

/**
 * Barre d'onglets mobile (US 13.4, Epique 13) : navigation fixee en bas
 * de l'ecran entre Dashboard / Historique / RH, seul composant du layout
 * a avoir besoin de `usePathname` pour savoir quelle route est active.
 * Masquee a partir du breakpoint `md`, ou `DesktopHeader` prend le relais
 * (US 13.5) : jamais les deux visibles en meme temps.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '../i18n/locale-provider';
import { isNavItemActive, NAV_ITEMS } from './nav-items';
import { NAV_ICONS } from './nav-icons';

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      aria-label={t('nav.ariaLabel')}
      className="border-royale-blue-800 bg-cr-bg-blue/95 fixed bottom-0 z-50 flex h-16 w-full flex-row items-center justify-around border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = NAV_ICONS[item.href];
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition-transform ${
              active
                ? 'border-cr-gold bg-royale-purple-700/40 -translate-y-1 border-2 text-yellow-400 shadow-[0_2px_0_rgba(0,0,0,0.4)]'
                : 'text-slate-400'
            }`}
          >
            {Icon !== undefined && <Icon className="h-6 w-6" />}
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
