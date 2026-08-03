'use client';

/**
 * Piege de focus pour une boite de dialogue modale (US 14.3, Epique 14) :
 * deplace le focus dans le conteneur a l'ouverture, cantonne Tab/Shift+Tab
 * a ses elements focusables, ferme sur Echap et restaure le focus sur
 * l'element declencheur a la fermeture. Generique (pas specifique au
 * panneau joueur) pour rester testable isolement.
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * `isOpen` pilote l'activation du piege ; `onClose` est appele sur Echap.
 * Retourne le ref a poser sur le conteneur de la boite de dialogue.
 */
export function useFocusTrap<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Ref plutot que dependance d'effet : `onClose` est souvent une fonction
  // inline recreee a chaque rendu du parent (ex. `() => setTag(null)`) --
  // la suivre en dependance rouvrirait le piege (et volerait le focus) a
  // chaque rendu du parent, pas seulement a l'ouverture/fermeture.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const firstFocusable = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || container === null || container === undefined) {
        return;
      }

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen]);

  return containerRef;
}
