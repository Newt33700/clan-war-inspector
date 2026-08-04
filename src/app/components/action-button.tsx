'use client';

/**
 * Bouton d'action "chunky" (Refonte des boutons) : au-dessus des styles
 * .btn-cr-* deja definis dans globals.css, garantit une zone de tap d'au
 * moins 44x44 (norme Apple HIG) et ajoute un retour haptique discret a
 * chaque action, comme le rendu tactile du jeu.
 */

import type { MouseEvent, ReactNode } from 'react';

type ActionButtonVariant = 'gold' | 'blue' | 'red' | 'green';

interface ActionButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  onClick,
  children,
  variant = 'gold',
  disabled = false,
  className = '',
}: ActionButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Micro-vibration sur mobile si supporte : ignoree silencieusement
    // ailleurs (desktop, navigateurs sans l'API).
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    onClick(event);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`btn-cr-${variant} min-h-11 min-w-11 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
