/**
 * Icones de la navigation globale (US 13.4/13.5) : formes simples en SVG
 * inline, comme le reste de l'app (`hr-assistant-section.tsx`,
 * `player-drawer.tsx`) plutot qu'une dependance a une librairie d'icones.
 */

interface NavIconProps {
  className?: string;
}

export function DashboardIcon({ className = 'h-6 w-6' }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6ZM13 3v6h8V3h-8Z" />
    </svg>
  );
}

/**
 * Sablier plein (retour utilisateur 2026-08-04, "P1" logos Clash) : remplace
 * l'ancienne horloge en traits fins, pour le meme poids visuel "chunky" que
 * les autres icones de navigation (formes pleines, pas de contour fin).
 */
export function HistoryIcon({ className = 'h-6 w-6' }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M6 2h12v2.2c0 1.9-1 3.6-3 5.3 2 1.7 3 3.4 3 5.3V22H6v-2.2c0-1.9 1-3.6 3-5.3-2-1.7-3-3.4-3-5.3V2Zm2 2.6C8 5.9 8.9 7 10.5 8.2h3C15.1 7 16 5.9 16 4.6V4H8v.6Zm0 14.8V20h8v-.6c0-1.3-.9-2.4-2.5-3.6h-3C8.9 17 8 18.1 8 19.4Z" />
    </svg>
  );
}

export function HrIcon({ className = 'h-6 w-6' }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 3c-3.3 0-6 1.8-6 4v2h12v-2c0-2.2-2.7-4-6-4Zm7 .3c2.3.4 4 1.8 4 3.7v2h-3v-2c0-1.4-.6-2.6-1.6-3.5.2 0 .4-.1.6-.2Z" />
    </svg>
  );
}

export function QuarantineIcon({ className = 'h-6 w-6' }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M12 2 3 5v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V5l-9-3Zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 14c-2.5-1-4.5-3-5.4-6 .3-1.8 2.8-3 5.4-3s5.1 1.2 5.4 3c-.9 3-2.9 5-5.4 6Z" />
    </svg>
  );
}

export function WeatherIcon({ className = 'h-6 w-6' }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M7 19a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17 8.5a4.5 4.5 0 0 1 2 8.5H7Z" />
    </svg>
  );
}

export const NAV_ICONS: Record<string, (props: NavIconProps) => React.JSX.Element> = {
  '/dashboard': DashboardIcon,
  '/historique': HistoryIcon,
  '/rh': HrIcon,
  '/nouveaux-membres': QuarantineIcon,
  '/meteo': WeatherIcon,
};
