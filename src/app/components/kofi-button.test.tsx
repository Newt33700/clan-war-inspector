import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KofiButton } from './kofi-button';

afterEach(() => {
  document.getElementById('kofi-widget-script')?.remove();
  delete window.kofiwidget2;
});

describe('KofiButton', () => {
  it('injecte le script officiel Ko-fi une seule fois et dessine le bouton une fois charge', () => {
    const { container } = render(<KofiButton />);

    const script = document.getElementById('kofi-widget-script') as HTMLScriptElement;
    expect(script).toBeInTheDocument();
    expect(script.src).toBe('https://storage.ko-fi.com/cdn/widget/Widget_2.js');

    const init = vi.fn();
    const draw = vi.fn();
    window.kofiwidget2 = { init, draw };
    script.dispatchEvent(new Event('load'));

    expect(init).toHaveBeenCalledWith('Faire un don', '#d2900b', 'clanwarinspector');
    const containerId = container.firstElementChild?.id;
    expect(containerId).toBeTruthy();
    expect(draw).toHaveBeenCalledWith(containerId);
  });

  it('reutilise le script deja present sans en ajouter un second (header + footer)', () => {
    render(<KofiButton />);
    render(<KofiButton />);

    expect(document.querySelectorAll('#kofi-widget-script')).toHaveLength(1);
  });

  it('dessine immediatement le bouton si le script est deja charge', () => {
    const init = vi.fn();
    const draw = vi.fn();
    window.kofiwidget2 = { init, draw };

    const { container } = render(<KofiButton />);

    const containerId = container.firstElementChild?.id;
    expect(init).toHaveBeenCalledWith('Faire un don', '#d2900b', 'clanwarinspector');
    expect(draw).toHaveBeenCalledWith(containerId);
  });

  it('genere des conteneurs avec des identifiants uniques pour deux instances', () => {
    const { container: containerA } = render(<KofiButton />);
    const { container: containerB } = render(<KofiButton />);

    const idA = containerA.firstElementChild?.id;
    const idB = containerB.firstElementChild?.id;
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);
  });
});
