/**
 * Traduction cote serveur (Server Components) : meme dictionnaire et
 * meme fonction `translate` que cote client (`LocaleProvider`), mais
 * resolue depuis le cookie de la requete plutot que depuis le contexte
 * React (indisponible dans un Server Component).
 */

import { readLocaleFromCookies } from '@/lib/locale-server';
import { dictionaries } from './dictionaries';
import { DEFAULT_LOCALE } from './locale';
import { translate, type TranslationVars } from './translate';

export async function getServerTranslator(): Promise<
  (key: string, vars?: TranslationVars) => string
> {
  const locale = (await readLocaleFromCookies()) ?? DEFAULT_LOCALE;
  const dictionary = dictionaries[locale];
  return (key, vars) => translate(dictionary, key, vars);
}
