/**
 * Liste des routes de la navigation globale (US 13.4/13.5, Epique 13),
 * partagee entre `MobileTabBar` et `DesktopHeader` pour ne detecter la
 * route active qu'une seule fois.
 */

export interface NavItem {
  href: string;
  /** Cle de traduction (namespace `nav`), resolue par les composants via `useTranslations`. */
  labelKey: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard' },
  { href: '/historique', labelKey: 'nav.historique' },
  { href: '/rh', labelKey: 'nav.rh' },
  { href: '/nouveaux-membres', labelKey: 'nav.nouveauxMembres' },
  { href: '/meteo', labelKey: 'nav.meteo' },
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
