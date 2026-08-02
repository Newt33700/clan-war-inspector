/**
 * Tests de la classification d'assiduite (US 4.4).
 * Les bornes exactes 11/12/15/16 sont exigees par le backlog.
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

  it('classe 12 comme avertissement (borne basse)', () => {
    expect(classifyBattleCount(12)).toBe('warning');
  });

  it('classe 11 comme critique (borne exacte)', () => {
    expect(classifyBattleCount(11)).toBe('critical');
  });

  it('classe 0 comme critique', () => {
    expect(classifyBattleCount(0)).toBe('critical');
  });
});

describe('WARNING_THRESHOLD', () => {
  it('vaut 12 conformement au backlog', () => {
    expect(WARNING_THRESHOLD).toBe(12);
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
