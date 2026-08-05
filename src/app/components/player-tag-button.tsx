'use client';

/**
 * Bouton reutilisable pour rendre un code joueur ("#...") cliquable et
 * ouvrir sa fiche (US 9), avec le meme style que le nom+tag du tableau des
 * membres. `stopPropagation` protege les usages a l'interieur d'une ligne
 * ou d'un accordeon eux-memes cliquables.
 */

import type { ReactNode } from 'react';
import { usePlayerDrawer } from './player-drawer-provider';

interface PlayerTagButtonProps {
  tag: string;
  className?: string;
  children: ReactNode;
}

export function PlayerTagButton({ tag, className = '', children }: PlayerTagButtonProps) {
  const { openPlayer } = usePlayerDrawer();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        openPlayer(tag);
      }}
      className={`text-left hover:underline focus-visible:underline ${className}`}
    >
      {children}
    </button>
  );
}
