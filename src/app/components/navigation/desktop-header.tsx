'use client';

/**
 * Navigation desktop (US 13.5, Epique 13) : liens horizontaux dans
 * l'en-tete, visibles a partir du breakpoint `md`, en remplacement de la
 * barre d'onglets mobile (US 13.4).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isNavItemActive, NAV_ITEMS } from './nav-items';

export function DesktopHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-cr-bg-blue/95 border-royale-blue-800 sticky top-0 z-50 hidden border-b backdrop-blur md:block">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className="text-royale-gold-400 font-display text-lg tracking-wide"
        >
          Clan War Inspector
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-semibold tracking-wide uppercase transition-transform ${
                  active
                    ? 'bg-royale-gold-400 text-royale-navy-950 border-cr-wood-dark -translate-y-0.5 border-2 shadow-[0_2px_0_rgba(0,0,0,0.4)]'
                    : 'text-royale-parchment-dim hover:text-royale-parchment'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
