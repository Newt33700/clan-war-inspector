/**
 * Resolution d'une cle de traduction imbriquee (ex. "footer.licenseLabel")
 * dans un dictionnaire, avec interpolation de variables `{nom}`. Fonction
 * pure, testee independamment du contexte React (`LocaleProvider`).
 */

import type { Dictionary } from './dictionaries/fr';

export type TranslationVars = Record<string, string | number>;

function resolveNode(dictionary: Dictionary, key: string): unknown {
  let node: unknown = dictionary;
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
}

function interpolate(template: string, vars: TranslationVars): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/**
 * Traduit `key` avec `dictionary`. Si la cle est introuvable ou ne pointe
 * pas vers une chaine, retourne la cle elle-meme (degradation visible en
 * developpement plutot qu'un crash en production).
 */
export function translate(
  dictionary: Dictionary,
  key: string,
  vars?: TranslationVars,
): string {
  const node = resolveNode(dictionary, key);
  if (typeof node !== 'string') {
    return key;
  }
  return vars === undefined ? node : interpolate(node, vars);
}
