'use client';

/**
 * Recherche/selection de clan (US 13.3, Epique 13), extraite de l'ancien
 * `ClanDashboard` monolithique : composant client autonome, affiche en
 * tete de `/dashboard`, `/historique` et `/rh` (US 13.6), pour changer de
 * clan depuis n'importe laquelle des 3 pages sans revenir sur Dashboard.
 *
 * Reprend a l'identique la detection transparente tag/nom (Epique 10) :
 * une saisie commencant par # (ou deja un tag valide) reste un tag, toute
 * autre saisie non vide devient une recherche par nom. La difference avec
 * l'ancien composant : au lieu de mettre a jour un etat local partage par
 * toute la page, valider un tag ecrit le cookie/localStorage (US 13.1)
 * puis navigue (Next Router) vers la page courante avec `?clan=<tag>` --
 * ce qui relance le Server Component de la page avec les nouvelles
 * donnees.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isValidClanTag } from '@/domain/clan/clan-tag';
import {
  isSearchableClanName,
  MIN_SEARCH_NAME_LENGTH,
  parseClanSearchResults,
} from '@/domain/clan/clan-search';
import { storeClanTag } from '@/lib/clan-tag-storage';
import { useApiResource } from '@/hooks/use-api-resource';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// Delai avant d'afficher l'erreur de format (US 6.5) : le temps d'une
// pause de frappe, pour ne pas juger une saisie encore en cours.
const FORMAT_ERROR_DEBOUNCE_MS = 400;

export function ClanSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [draftTag, setDraftTag] = useState('');

  const draftIsValid = isValidClanTag(draftTag);
  const debouncedDraftTag = useDebouncedValue(draftTag, FORMAT_ERROR_DEBOUNCE_MS);
  const trimmedDebouncedDraft = debouncedDraftTag.trim();
  // Detection transparente tag / nom (US 10.1, epique 10) : une saisie
  // commencant par # (ou deja reconnue comme tag valide, avec ou sans #)
  // reste traitee comme un tag ; toute autre saisie non vide devient une
  // recherche par nom, sans bouton ni interrupteur a actionner.
  const looksLikeTag =
    trimmedDebouncedDraft.startsWith('#') || isValidClanTag(trimmedDebouncedDraft);
  const showFormatError = looksLikeTag && !isValidClanTag(trimmedDebouncedDraft);
  const isNameSearch = !looksLikeTag && trimmedDebouncedDraft.length > 0;
  const searchQueryTooShort =
    isNameSearch && !isSearchableClanName(trimmedDebouncedDraft);
  const searchPath =
    isNameSearch && !searchQueryTooShort
      ? `/api/clans?name=${encodeURIComponent(trimmedDebouncedDraft)}`
      : null;
  const searchState = useApiResource<unknown>(searchPath);
  const searchResults = useMemo(
    () =>
      searchState.status === 'success' ? parseClanSearchResults(searchState.data) : [],
    [searchState],
  );

  // Charge un clan par tag connu : point d'entree commun a la soumission du
  // formulaire (tag direct), a la resolution automatique d'un resultat de
  // recherche unique, et au clic sur un candidat (US 10.1). Reste sur la
  // page courante (US 13.3) : changer de clan depuis Historique y reste.
  const loadClan = useCallback(
    (tag: string) => {
      storeClanTag(tag);
      setDraftTag('');
      const target = `${pathname === '/' ? '/dashboard' : pathname}?clan=${encodeURIComponent(tag)}`;
      router.replace(target);
    },
    [pathname, router],
  );

  // Un resultat unique se charge directement, comme un tag saisi
  // explicitement (US 10.1) : pas d'etape intermediaire pour l'utilisateur.
  useEffect(() => {
    if (searchResults.length === 1) {
      loadClan(searchResults[0]!.tag);
    }
  }, [searchResults, loadClan]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftIsValid) {
      loadClan(draftTag);
    }
  }

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label="Recherche de clan"
      >
        <label className="flex flex-col gap-1">
          <span className="text-royale-parchment-dim text-sm">Tag ou nom du clan</span>
          <input
            type="text"
            value={draftTag}
            onChange={(event) => setDraftTag(event.target.value)}
            placeholder="#20J20QG ou Chevreaux Team"
            className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment min-h-11 rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={!draftIsValid}
          className="bg-royale-gold-400 text-royale-navy-950 min-h-11 rounded-md px-4 py-2 font-semibold disabled:opacity-40"
        >
          Inspecter
        </button>
        <p className="text-royale-parchment-dim w-full text-xs">
          Saisissez le tag de votre clan (visible dans Clash Royale, sous son nom, sur l
          ecran du clan) ou directement son nom.
        </p>
        {showFormatError && (
          <p className="text-royale-red-500 w-full text-sm">
            Tag invalide : caracteres autorises 0289PYLQGRJCUV, longueur 3 a 14.
          </p>
        )}
      </form>

      {searchQueryTooShort && (
        <p className="text-royale-parchment-dim text-sm">
          Continuez a taper ({MIN_SEARCH_NAME_LENGTH} caracteres minimum) pour rechercher
          par nom.
        </p>
      )}

      {searchPath !== null && searchState.status === 'loading' && (
        <p role="status" className="text-royale-parchment-dim">
          Recherche de clans nommes « {trimmedDebouncedDraft} »...
        </p>
      )}

      {searchPath !== null && searchState.status === 'error' && (
        <div className="space-y-2">
          <p role="alert" className="text-royale-red-500">
            {searchState.message}
          </p>
          <button
            type="button"
            onClick={searchState.refetch}
            className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold"
          >
            Reessayer
          </button>
        </div>
      )}

      {searchState.status === 'success' && searchResults.length === 0 && (
        <p className="text-royale-parchment-dim">
          Aucun clan ne correspond a « {trimmedDebouncedDraft} ».
        </p>
      )}

      {searchState.status === 'success' && searchResults.length > 1 && (
        <ul className="space-y-2">
          {searchResults.map((candidate) => (
            <li key={candidate.tag}>
              <button
                type="button"
                data-testid="clan-search-candidate"
                onClick={() => loadClan(candidate.tag)}
                className="border-royale-blue-800 bg-royale-navy-900 hover:bg-royale-blue-800/20 flex w-full flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-left"
              >
                {candidate.badgeUrl.length > 0 && (
                  <img
                    src={candidate.badgeUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-8 w-8"
                  />
                )}
                <span>
                  <span className="text-royale-parchment block font-semibold">
                    {candidate.name}
                    <span className="text-royale-parchment-dim ml-2 text-xs font-normal">
                      {candidate.tag}
                    </span>
                  </span>
                  <span className="text-royale-parchment-dim text-xs">
                    {candidate.memberCount}/50 membres
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
