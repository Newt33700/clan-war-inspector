/**
 * Controle de contraste automatise du theme (US 6.8) : lit les tokens
 * reellement definis dans globals.css (pas une copie susceptible de
 * diverger) et verifie que chaque paire texte/fond effectivement utilisee
 * dans l'app respecte le niveau AA (>= 4.5:1 pour du texte de taille
 * normale).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

function readThemeTokens(): Record<string, string> {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf-8');
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--color-royale-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[match[1]!] = match[2]!;
  }
  return tokens;
}

describe('Contraste des tokens du theme (AA >= 4.5:1)', () => {
  const tokens = readThemeTokens();

  it('a bien extrait les tokens de globals.css', () => {
    // Garde-fou : si le regex ou le chemin du fichier casse, ce test echoue
    // plutot que de laisser passer une suite silencieusement vide.
    expect(Object.keys(tokens).length).toBeGreaterThan(5);
  });

  const textOnNavy950: [string, string][] = [
    ['parchment', 'parchment'],
    ['parchment-dim', 'parchment-dim'],
    ['gold-400', 'gold-400'],
    ['green-500', 'green-500'],
    // Texte d'alerte/critique (messages d'erreur, decks a 0, historique
    // critique) : toujours affiche sur le fond principal navy-950.
    ['red-500', 'red-500'],
  ];

  it.each(textOnNavy950)(
    '%s sur navy-950 atteint au moins 4.5:1',
    (_label, tokenName) => {
      const textColor = tokens[tokenName];
      const background = tokens['navy-950'];
      expect(textColor).toBeDefined();
      expect(background).toBeDefined();
      expect(contrastRatio(textColor!, background!)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('parchment sur les boutons dores (navy-950 texte sur gold-400) reste lisible', () => {
    expect(
      contrastRatio(tokens['navy-950']!, tokens['gold-400']!),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
