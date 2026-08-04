'use client';

import { useEffect, useId } from 'react';

/**
 * Widget officiel Ko-fi (Widget_2.js). Le script expose un objet global
 * `kofiwidget2` qui dessine le bouton dans un conteneur donne -- on evite le
 * `document.write` par defaut du script en lui passant l'id du conteneur, ce
 * qui le rend compatible avec le rendu React/SSR de Next.js et utilisable a
 * plusieurs endroits de la page (header + footer) sans conflit.
 */

const KOFI_SCRIPT_ID = 'kofi-widget-script';
const KOFI_SCRIPT_SRC = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
const KOFI_USERNAME = 'clanwarinspector';
const KOFI_LABEL = 'Faire un don';
const KOFI_BUTTON_COLOR = '#d2900b';

declare global {
  interface Window {
    kofiwidget2?: {
      init: (label: string, color: string, kofiId: string) => void;
      draw: (containerId?: string) => void;
    };
  }
}

function drawKofiButton(containerId: string) {
  window.kofiwidget2?.init(KOFI_LABEL, KOFI_BUTTON_COLOR, KOFI_USERNAME);
  window.kofiwidget2?.draw(containerId);
}

export function KofiButton({ className }: { className?: string }) {
  const containerId = `kofi-widget-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    if (window.kofiwidget2) {
      drawKofiButton(containerId);
      return;
    }

    let script = document.getElementById(KOFI_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = KOFI_SCRIPT_ID;
      script.src = KOFI_SCRIPT_SRC;
      document.body.appendChild(script);
    }

    const handleLoad = () => drawKofiButton(containerId);
    script.addEventListener('load', handleLoad);
    return () => script?.removeEventListener('load', handleLoad);
  }, [containerId]);

  return <div id={containerId} className={className} />;
}
