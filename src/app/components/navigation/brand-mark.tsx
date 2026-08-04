/**
 * Emblème de marque (2026-08-04, cf. la bannière ecusson+couronne du
 * store.supercell.com/clash-royale) : ecusson dessine a la main, dans le
 * meme esprit que `section-icons.tsx` (pas d'asset officiel du jeu, pas
 * de librairie d'icones externe).
 */

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'h-8 w-8' }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M4 5h24v13c0 7.5-6.2 11.6-12 13-5.8-1.4-12-5.5-12-13V5Z"
        className="fill-royale-blue-800 stroke-royale-gold-400"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 15l3 2 3.5-6 3.5 6 3-2-1 8h-11l-1-8Z"
        className="fill-royale-gold-400"
      />
    </svg>
  );
}
