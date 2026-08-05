'use client';

/**
 * Ouvre la fiche joueur (US 9, `player-drawer.tsx`) depuis n'importe quelle
 * page : le panneau est monte une seule fois ici (layout racine) plutot que
 * par chaque vue, pour que le code du joueur ("#...") reste cliquable
 * partout ou il est affiche, pas seulement sur le tableau des membres du
 * dashboard.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PlayerDrawer } from './player-drawer';

interface PlayerDrawerContextValue {
  /** Ouvre le panneau d'inspection pour ce tag de joueur. */
  openPlayer: (tag: string) => void;
}

const PlayerDrawerContext = createContext<PlayerDrawerContextValue | null>(null);

export function PlayerDrawerProvider({ children }: { children: ReactNode }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // Le panneau (overlay + aside) ne monte dans le DOM qu'apres une premiere
  // ouverture : tant qu'aucun joueur n'a jamais ete consulte, il n'y a rien
  // a fermer ni a animer, et ca evite d'alourdir chaque page de deux
  // elements caches en permanence.
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const openPlayer = useCallback((tag: string) => {
    setSelectedTag(tag);
    setHasOpenedOnce(true);
  }, []);
  const closePlayer = useCallback(() => setSelectedTag(null), []);
  const value = useMemo(() => ({ openPlayer }), [openPlayer]);

  return (
    <PlayerDrawerContext.Provider value={value}>
      {children}
      {hasOpenedOnce && <PlayerDrawer tag={selectedTag} onClose={closePlayer} />}
    </PlayerDrawerContext.Provider>
  );
}

export function usePlayerDrawer(): PlayerDrawerContextValue {
  const context = useContext(PlayerDrawerContext);
  if (context === null) {
    throw new Error('usePlayerDrawer must be used within a PlayerDrawerProvider');
  }
  return context;
}
