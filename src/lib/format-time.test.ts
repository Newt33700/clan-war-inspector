/**
 * Tests du formatage d'horodatage (US 6.4).
 */

import { describe, expect, it } from 'vitest';
import { formatTimeOfDay } from './format-time';

describe('formatTimeOfDay', () => {
  it('formate heures et minutes sur 2 chiffres', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 9, 5))).toBe('09:05');
  });

  it('ne zero-pad pas au-dela de 2 chiffres', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 23, 59))).toBe('23:59');
  });

  it('gere minuit', () => {
    expect(formatTimeOfDay(new Date(2024, 0, 1, 0, 0))).toBe('00:00');
  });
});
