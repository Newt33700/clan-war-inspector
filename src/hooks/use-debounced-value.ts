'use client';

/**
 * Debounce generique (US 6.5) : retarde la repercussion d'une valeur qui
 * change vite (frappe clavier), pour ne pas juger une saisie en cours.
 */

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
