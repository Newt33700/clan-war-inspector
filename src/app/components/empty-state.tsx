/**
 * Etat vide illustre (directive UX Epique 7) : icone + titre + description,
 * pour ne jamais laisser un panneau ou une section vide sans explication.
 */

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="border-royale-blue-800 flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-10 text-center">
      <div aria-hidden="true" className="text-royale-parchment-dim">
        {icon}
      </div>
      <p className="text-royale-parchment font-semibold">{title}</p>
      {description !== undefined && (
        <p className="text-royale-parchment-dim text-sm">{description}</p>
      )}
    </div>
  );
}
