'use client';

/**
 * Fond "damier" en losange par onglet (2026-08-04, cf. store.supercell.com/
 * clash-royale) : un ton par section, pour distinguer les pages sans
 * revenir a un fond sombre. Calque plein ecran fixe (comme `main`, qui n'a
 * pas de fond propre) plutot qu'un style sur `body` : seul moyen de faire
 * reagir la couleur a la route cote client sans transformer le layout
 * (Server Component) en Client Component.
 */

import { usePathname } from 'next/navigation';
import { isNavItemActive, NAV_ITEMS } from './nav-items';

const ROUTE_BACKDROP_CLASSES: Record<string, string> = {
  '/dashboard': 'bg-backdrop-blue',
  '/historique': 'bg-backdrop-purple',
  '/rh': 'bg-backdrop-teal',
  '/nouveaux-membres': 'bg-backdrop-gold',
  '/meteo': 'bg-backdrop-sky',
};

const DEFAULT_BACKDROP_CLASS = 'bg-backdrop-blue';

function resolveBackdropClassName(pathname: string): string {
  const activeItem = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href));
  if (activeItem === undefined) {
    return DEFAULT_BACKDROP_CLASS;
  }
  return ROUTE_BACKDROP_CLASSES[activeItem.href] ?? DEFAULT_BACKDROP_CLASS;
}

export function PageBackdrop() {
  const pathname = usePathname();

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 -z-10 ${resolveBackdropClassName(pathname)}`}
    />
  );
}
