/**
 * Liste des routes de la navigation globale (US 13.4/13.5, Epique 13),
 * partagee entre `MobileTabBar` et `DesktopHeader` pour ne detecter la
 * route active qu'une seule fois.
 */

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/historique', label: 'Historique' },
  { href: '/rh', label: 'RH' },
];

/**
 * Vrai si `pathname` correspond a `href` (page exacte ou sous-route
 * future, ex. `/historique/detail`) : correspondance par prefixe de
 * segment, pas une simple inclusion de chaine (`/rh` ne doit pas
 * s'activer sur `/rhum`).
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
