/**
 * Controle de contraste automatise du theme (US 6.8) : lit les tokens
 * reellement definis dans globals.css (pas une copie susceptible de
 * diverger) et verifie que chaque paire texte/fond effectivement utilisee
 * dans l'app respecte le niveau AA (>= 4.5:1 pour du texte de taille
 * normale).
 *
 * Canevas clair (2026-08-04) : le fond de page par defaut est desormais
 * `canvas` (quasi blanc), plus `navy-950`. `gold-400`/`green-500`/`red-500`
 * restent utilises comme fonds de badges/boutons (texte blanc ou
 * navy-950 dessus, ailleurs dans ce fichier) mais plus comme couleur de
 * texte directement sur le canevas : les endroits qui en avaient besoin
 * (confirmations, alertes, "404") sont passes a des teintes plus foncees
 * (red-700, ou des tons Tailwind vert/or fonces) verifiees ci-dessous.
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

  const textOnCanvas: [string, string][] = [
    ['parchment', 'parchment'],
    ['parchment-dim', 'parchment-dim'],
    // Texte d'alerte/critique (messages d'erreur) affiche directement sur
    // le canevas : red-500 (2.8:1 environ) n'y suffit plus, red-700 si.
    ['red-700', 'red-700'],
  ];

  it.each(textOnCanvas)('%s sur le canevas clair atteint au moins 4.5:1', (_label, tokenName) => {
    const textColor = tokens[tokenName];
    const background = tokens['canvas'];
    expect(textColor).toBeDefined();
    expect(background).toBeDefined();
    expect(contrastRatio(textColor!, background!)).toBeGreaterThanOrEqual(4.5);
  });

  it('parchment sur les boutons dores (navy-950 texte sur gold-400) reste lisible', () => {
    expect(
      contrastRatio(tokens['navy-950']!, tokens['gold-400']!),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('vert/or fonces (classes Tailwind hors design tokens) utilises comme texte direct sur le canevas restent lisibles', () => {
    const canvas = tokens['canvas']!;
    expect(contrastRatio('#166534', canvas)).toBeGreaterThanOrEqual(4.5); // text-green-800
    expect(contrastRatio('#92400e', canvas)).toBeGreaterThanOrEqual(4.5); // text-amber-800
  });

  const BACKDROP_ROUTES = ['blue', 'purple', 'teal', 'gold', 'sky'];
  // Meme jeu que `textOnCanvas` ci-dessus, plus les teintes Tailwind
  // hors tokens (verifiees separement au-dessus) : le texte courant peut
  // s'afficher directement sur n'importe lequel des 5 damiers de
  // `PageBackdrop` (page-backdrop.tsx), pas seulement sur `canvas`.
  const TEXT_ON_BACKDROP = [
    ['parchment', tokens['parchment']],
    ['parchment-dim', tokens['parchment-dim']],
    ['red-700', tokens['red-700']],
    ['green-800 (Tailwind)', '#166534'],
    ['amber-800 (Tailwind)', '#92400e'],
  ] as const;

  it.each(BACKDROP_ROUTES)(
    "le damier '%s' (tuile la plus sombre) reste lisible pour tout le texte courant",
    (route) => {
      // Tuile sombre = le pire cas des deux tons du damier (verifie
      // contre elle suffit a couvrir la tuile claire aussi).
      const darkTile = tokens[`backdrop-${route}-dark`];
      expect(darkTile).toBeDefined();
      for (const [, textColor] of TEXT_ON_BACKDROP) {
        expect(contrastRatio(textColor!, darkTile!)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
