'use client';

/**
 * Sommaire de navigation entre sections (audit UX du 2026-08-02, US-7) :
 * le dashboard s'etend sur une seule page tres longue, sans sommaire ni
 * onglet pour sauter directement a une section (ex. Assistant RH).
 */

import { useEffect, useState } from 'react';

interface SectionNavItem {
  id: string;
  label: string;
}

const SECTIONS: SectionNavItem[] = [
  { id: 'membres', label: 'Membres' },
  { id: 'guerre-en-cours', label: 'Guerre en cours' },
  { id: 'historique', label: 'Historique' },
  { id: 'assistant-rh', label: 'Assistant RH' },
];

export function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // IntersectionObserver n'existe pas sous jsdom : le sommaire reste
    // fonctionnel (liens + defilement), seule la mise en avant de la
    // section active est degradee gracieusement.
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const elements = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0]!.target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav
      aria-label="Sections du dashboard"
      className="bg-royale-navy-950/95 border-royale-blue-800 sticky top-0 z-20 flex flex-wrap gap-2 border-b py-2 backdrop-blur"
    >
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={(event) => handleClick(event, section.id)}
          aria-current={activeId === section.id ? 'true' : undefined}
          className={`rounded-md px-3 py-1 text-xs font-semibold tracking-wide uppercase transition-colors ${
            activeId === section.id
              ? 'bg-royale-gold-400 text-royale-navy-950'
              : 'text-royale-parchment-dim hover:text-royale-parchment'
          }`}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
