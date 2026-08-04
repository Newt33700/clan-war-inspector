/**
 * Bloc de chargement generique (directive UX Epique 7) : anime en pulse,
 * remplace texte/images pendant un fetch. `className` fixe la taille.
 */

interface SkeletonProps {
  className?: string;
  /** Libelle accessible du contenu en cours de chargement. */
  label?: string;
}

export function Skeleton({ className = 'h-4 w-full', label }: SkeletonProps) {
  return (
    <span
      role={label !== undefined ? 'status' : undefined}
      aria-label={label}
      className={`block animate-pulse rounded bg-slate-200 ${className}`}
    />
  );
}
