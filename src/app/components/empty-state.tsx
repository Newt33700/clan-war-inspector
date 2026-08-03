/**
 * Etat vide illustre (directive UX Epique 7) : icone + titre + description,
 * pour ne jamais laisser un panneau ou une section vide sans explication.
 */

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Fond clair (panneau/modale) plutot que le canevas sombre par defaut. */
  tone?: 'dark' | 'light';
}

export function EmptyState({ icon, title, description, tone = 'dark' }: EmptyStateProps) {
  const isLight = tone === 'light';
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-10 text-center ${
        isLight ? 'bg-cr-panel-light border-black' : 'border-royale-blue-800'
      }`}
    >
      <div
        aria-hidden="true"
        className={isLight ? 'text-slate-500' : 'text-royale-parchment-dim'}
      >
        {icon}
      </div>
      <p
        className={`font-semibold ${isLight ? 'text-slate-900' : 'text-royale-parchment'}`}
      >
        {title}
      </p>
      {description !== undefined && (
        <p
          className={`text-sm ${isLight ? 'text-slate-500' : 'text-royale-parchment-dim'}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
