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
 *
 * Replie automatiquement des qu'un clan est actif (retour utilisateur du
 * 2026-08-04 : le formulaire complet reste affiche en permanence, "prend
 * de la place pour rien") : `hasActiveClan` (fourni par chaque `page.tsx`,
 * qui connait deja le tag resolu cote serveur) pilote l'etat replie/deplie
 * initial, resynchronise a chaque nouveau clan charge.
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
import {
  readRecentClans,
  rememberRecentClan,
  type RecentClan,
} from '@/lib/recent-clans-storage';
import { useApiResource } from '@/hooks/use-api-resource';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTranslations } from '../i18n/locale-provider';

// Delai avant d'afficher l'erreur de format (US 6.5) : le temps d'une
// pause de frappe, pour ne pas juger une saisie encore en cours.
const FORMAT_ERROR_DEBOUNCE_MS = 400;

interface ClanSearchFormProps {
  /** Vrai si une page a deja resolu un clan actif (URL ou cookie). */
  hasActiveClan?: boolean;
}

export function ClanSearchForm({ hasActiveClan = false }: ClanSearchFormProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [draftTag, setDraftTag] = useState('');
  const [isExpanded, setIsExpanded] = useState(!hasActiveClan);
  const [recentClans, setRecentClans] = useState<RecentClan[]>([]);

  useEffect(() => {
    setIsExpanded(!hasActiveClan);
  }, [hasActiveClan]);

  useEffect(() => {
    setRecentClans(readRecentClans());
  }, []);

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
  // recherche unique, et au clic sur un candidat (US 10.1) ou un clan
  // recent. Reste sur la page courante (US 13.3) : changer de clan depuis
  // Historique y reste.
  const loadClan = useCallback(
    (tag: string, name?: string) => {
      storeClanTag(tag);
      rememberRecentClan(tag, name);
      setRecentClans(readRecentClans());
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
      loadClan(searchResults[0]!.tag, searchResults[0]!.name);
    }
  }, [searchResults, loadClan]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftIsValid) {
      loadClan(draftTag);
    }
  }

  if (hasActiveClan && !isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        aria-expanded={false}
        className="btn-cr-blue min-h-11 px-3 py-1 text-xs"
      >
        {t('clanSearch.changeClan')}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {hasActiveClan && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          aria-expanded={true}
          className="btn-cr-blue min-h-11 px-3 py-1 text-xs"
        >
          {t('clanSearch.changeClan')}
        </button>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t('clanSearch.ariaLabel')}
      >
        <label className="flex flex-col gap-1">
          <span className="text-royale-parchment-dim text-sm">
            {t('clanSearch.fieldLabel')}
          </span>
          <input
            type="text"
            value={draftTag}
            onChange={(event) => setDraftTag(event.target.value)}
            placeholder={t('clanSearch.placeholder')}
            className="cr-glass text-royale-parchment min-h-11 px-3 py-2 placeholder:text-slate-400"
          />
        </label>
        <button
          type="submit"
          disabled={!draftIsValid}
          className="btn-cr-gold min-h-11 px-4 py-2 disabled:opacity-40"
        >
          {t('clanSearch.submit')}
        </button>
        {/* text-sm (14px), pas text-xs (US 14.4) : lisibilite mobile minimale. */}
        <p className="text-royale-parchment-dim w-full text-sm">
          {t('clanSearch.helpText')}
        </p>
        {showFormatError && (
          <p className="text-royale-red-700 w-full text-sm">
            {t('clanSearch.formatError')}
          </p>
        )}
      </form>

      {recentClans.length > 0 && (
        <div className="space-y-1">
          <p className="text-royale-parchment-dim text-xs tracking-wide uppercase">
            {t('clanSearch.recentClansLabel')}
          </p>
          <div className="flex flex-wrap gap-2">
            {recentClans.map((clan) => (
              <button
                key={clan.tag}
                type="button"
                data-testid="recent-clan"
                onClick={() => loadClan(clan.tag, clan.name)}
                className="cr-pill-row px-3 py-1 text-xs text-slate-900"
              >
                {clan.name}
                {/* Nom de repli identique au tag (US 13.3, clan charge par
                    tag direct avant que son vrai nom soit connu) : ne pas
                    repeter le tag deux fois. */}
                {clan.name !== clan.tag && (
                  <span className="ml-1 text-slate-500">{clan.tag}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {searchQueryTooShort && (
        <p className="text-royale-parchment-dim text-sm">
          {t('clanSearch.continueTyping', { min: MIN_SEARCH_NAME_LENGTH })}
        </p>
      )}

      {searchPath !== null && searchState.status === 'loading' && (
        <p role="status" className="text-royale-parchment-dim">
          {t('clanSearch.searching', { query: trimmedDebouncedDraft })}
        </p>
      )}

      {searchPath !== null && searchState.status === 'error' && (
        <div className="space-y-2">
          <p role="alert" className="text-royale-red-700">
            {searchState.message}
          </p>
          <button
            type="button"
            onClick={searchState.refetch}
            className="btn-cr-red px-3 py-1 text-sm"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {searchState.status === 'success' && searchResults.length === 0 && (
        <p className="text-royale-parchment-dim">
          {t('clanSearch.noResults', { query: trimmedDebouncedDraft })}
        </p>
      )}

      {searchState.status === 'success' && searchResults.length > 1 && (
        <div className="bg-cr-panel-light rounded-lg border-2 border-black p-3">
          <ul className="space-y-2">
            {searchResults.map((candidate) => (
              <li key={candidate.tag}>
                <button
                  type="button"
                  data-testid="clan-search-candidate"
                  onClick={() => loadClan(candidate.tag, candidate.name)}
                  className="cr-pill-row flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:from-slate-50 hover:to-slate-200"
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
                    <span className="font-display block font-semibold text-slate-900">
                      {candidate.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {candidate.tag}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {t('clanSearch.memberCount', { count: candidate.memberCount })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
