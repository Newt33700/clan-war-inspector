/**
 * Petites icones de titre de section (identite visuelle Clash Royale,
 * 2026-08-03) : formes SVG originales dessinees a la main, dans le meme
 * esprit que `navigation/nav-icons.tsx` et `hr-assistant-section.tsx`
 * (pas d'asset officiel du jeu, pas de librairie d'icones externe).
 */

interface SectionIconProps {
  className?: string;
}

/** Trophee dore : podium, classements, scores. */
export function TrophyIcon({ className = 'h-5 w-5' }: SectionIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M6 3h12v2h2a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4h-.35A6 6 0 0 1 13 15.9V18h3v2H8v-2h3v-2.1A6 6 0 0 1 7.35 12H7a4 4 0 0 1-4-4V6a1 1 0 0 1 1-1h2V3Zm0 4H5v1a2 2 0 0 0 2 2V7Zm12 0v3a2 2 0 0 0 2-2V7h-2Z" />
    </svg>
  );
}

/** Epees croisees : guerre, combats. */
export function SwordsIcon({ className = 'h-5 w-5' }: SectionIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M3 3l7 7-1.5 1.5L2 5V3h1Zm18 0v2l-6.5 6.5L13 10l6-6 2-1v0ZM9.5 12L11 13.5 4 20.5l-1.5-1.5L9.5 12Zm5 0l6.5 6.5L19.5 20 13 13.5 14.5 12Z" />
    </svg>
  );
}

/** Groupe de membres : effectif du clan. */
export function MembersIcon({ className = 'h-5 w-5' }: SectionIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6v1H2v-1Zm14.5-4.7c2.1.5 3.5 1.9 3.5 3.7v2h-3v-2c0-1.4-.6-2.6-1.6-3.5.4-.1.7-.2 1.1-.2Z" />
    </svg>
  );
}
