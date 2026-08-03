/**
 * Tests de la classification d'assiduite (US 4.4, seuil Epique 12).
 * Les bornes exactes 7/8/15/16 sont exigees par le backlog.
 */

import { describe, expect, it } from 'vitest';
import {
  classifyBattleCount,
  LEVEL_LABELS,
  LEVEL_SYMBOLS,
  WARNING_THRESHOLD,
} from './attendance-level';

describe('classifyBattleCount', () => {
  it('classe 16 comme complet', () => {
    expect(classifyBattleCount(16)).toBe('complete');
  });

  it('classe 15 comme avertissement (borne haute)', () => {
    expect(classifyBattleCount(15)).toBe('warning');
  });

  it('classe 8 comme avertissement (borne basse)', () => {
    expect(classifyBattleCount(8)).toBe('warning');
  });

  it('classe 7 comme critique (borne exacte)', () => {
    expect(classifyBattleCount(7)).toBe('critical');
  });

  it('classe 0 comme critique', () => {
    expect(classifyBattleCount(0)).toBe('critical');
  });
});

describe('WARNING_THRESHOLD', () => {
  it('vaut 8 (50% de 16), aligne sur minWeeklyBattles', () => {
    expect(WARNING_THRESHOLD).toBe(8);
  });
});

describe('libelles et symboles accessibles', () => {
  it('fournit un libelle distinct et non vide par niveau', () => {
    const labels = Object.values(LEVEL_LABELS);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('fournit un symbole distinct par niveau', () => {
    const symbols = Object.values(LEVEL_SYMBOLS);
    expect(new Set(symbols).size).toBe(symbols.length);
  });
});
