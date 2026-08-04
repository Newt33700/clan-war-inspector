'use client';

/**
 * Bouton "Copier le tag" (US 7) : passe au vert avec un check pendant
 * 2 secondes au clic, comme le bouton "Copier la liste" de la purge
 * (US 6.6), generalise ici pour etre reutilise sur les cartes RH.
 */

import { useEffect, useState } from 'react';

const CONFIRMATION_MS = 2000;

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Copier le tag' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleClick() {
    // Micro-vibration sur mobile si supporte, pour marquer l'action de
    // copie (retour tactile, comme le jeu).
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Presse-papiers indisponible (permissions, contexte non securise) :
      // pas de raison de bloquer l'utilisateur, on ignore silencieusement.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1 text-xs transition-colors duration-300 ${
        copied ? 'btn-cr-green' : 'btn-cr-gold'
      }`}
    >
      {copied ? '✓ Copie !' : label}
    </button>
  );
}
