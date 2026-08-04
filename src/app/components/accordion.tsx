'use client';

/**
 * Primitive d'accordeon tactile partagee (Navigation Mobile "Tactile",
 * etendue aux cartes RH et Quarantaine) : un en-tete toujours visible
 * (`summary`), un chevron qui pivote, et un contenu deplie qui ne monte
 * dans le DOM que si `isOpen` (perf : rien de charge tant que ferme).
 */

import { useState, type ReactNode } from 'react';

interface AccordionProps {
  /** Contenu toujours visible, cliquable pour ouvrir/fermer. */
  summary: ReactNode;
  /** Contenu deplie, monte dans le DOM uniquement une fois ouvert. */
  children: ReactNode;
  /** Classe additionnelle sur le bouton d'en-tete. */
  summaryClassName?: string;
  /** Classe additionnelle sur le conteneur du contenu deplie. */
  detailClassName?: string;
}

export function Accordion({
  summary,
  children,
  summaryClassName = '',
  detailClassName = '',
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-3 text-left ${summaryClassName}`}
      >
        {summary}
        <span
          aria-hidden="true"
          className={`ml-auto shrink-0 text-lg font-black text-slate-900 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          {isOpen && <div className={detailClassName}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
