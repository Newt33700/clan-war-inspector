/**
 * Tests du sommaire de navigation entre sections (audit UX du 2026-08-02,
 * US-7).
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionNav } from './section-nav';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SectionNav', () => {
  it('propose un lien vers chacune des 4 sections du dashboard', () => {
    render(<SectionNav />);
    expect(screen.getByRole('link', { name: /membres/i })).toHaveAttribute(
      'href',
      '#membres',
    );
    expect(screen.getByRole('link', { name: /guerre en cours/i })).toHaveAttribute(
      'href',
      '#guerre-en-cours',
    );
    expect(screen.getByRole('link', { name: /historique/i })).toHaveAttribute(
      'href',
      '#historique',
    );
    expect(screen.getByRole('link', { name: /assistant rh/i })).toHaveAttribute(
      'href',
      '#assistant-rh',
    );
  });

  it('fait defiler vers la section ciblee au clic, sans changer de page', () => {
    document.body.innerHTML += '<section id="historique"></section>';
    const scrollIntoView = vi.fn();
    const target = document.getElementById('historique')!;
    target.scrollIntoView = scrollIntoView;

    render(<SectionNav />);
    fireEvent.click(screen.getByRole('link', { name: /historique/i }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('met en avant la section active via IntersectionObserver quand disponible', () => {
    document.body.innerHTML += '<section id="membres"></section>';
    const target = document.getElementById('membres')!;

    let capturedCallback: IntersectionObserverCallback | null = null;
    const observe = vi.fn();
    const disconnect = vi.fn();
    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

    const { unmount } = render(<SectionNav />);
    expect(observe).toHaveBeenCalledWith(target);

    act(() => {
      capturedCallback!(
        [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
        new FakeIntersectionObserver(() => undefined) as unknown as IntersectionObserver,
      );
    });

    expect(screen.getByRole('link', { name: /membres/i })).toHaveAttribute(
      'aria-current',
      'true',
    );

    unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('reste fonctionnel si aucune section n est presente dans le DOM', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    expect(() => render(<SectionNav />)).not.toThrow();
    vi.unstubAllGlobals();
  });
});
