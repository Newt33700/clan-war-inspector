'use client';

/**
 * Dashboard du clan : couche de donnees unique du produit.
 *
 * Charge les trois ressources du proxy (clan, guerre en cours,
 * historique) et alimente des sections purement presentationnelles :
 * membres (US 3.1/3.2), guerre en cours (US 4.1), historique et alertes
 * (US 4.3/4.4), vue de renvoi (US 5.1).
 */

import { useEffect, useMemo, useState } from 'react';
import { isValidClanTag, toApiTagSegment } from '@/domain/clan/clan-tag';
import { parseClanSummary } from '@/domain/clan/clan-summary';
import { readStoredClanTag, storeClanTag } from '@/lib/clan-tag-storage';
import { readClanTagFromUrl, writeClanTagToUrl } from '@/lib/clan-tag-url';
import {
  filterMembersByQuery,
  parseClanMembers,
  sortMembers,
  type MemberSortKey,
  type SortDirection,
} from '@/domain/clan/members';
import { buildClanWarHistory } from '@/domain/war/war-history';
import { useApiResource } from '@/hooks/use-api-resource';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ClanHeader } from './clan-header';
import { CurrentWarSection } from './current-war-section';
import { HallOfFameSection } from './hall-of-fame-section';
import { HrAssistantSection } from './hr-assistant-section';
import { MembersTable } from './members-table';
import { PlayerDrawer } from './player-drawer';
import { PurgeSection } from './purge-section';
import { SectionNav } from './section-nav';
import { WarHistorySection } from './war-history-section';

// Delai avant d'afficher l'erreur de format (US 6.5) : le temps d'une
// pause de frappe, pour ne pas juger une saisie encore en cours.
const FORMAT_ERROR_DEBOUNCE_MS = 400;

export function ClanDashboard() {
  const [draftTag, setDraftTag] = useState('');
  const [clanPath, setClanPath] = useState<string | null>(null);
  const [submittedTag, setSubmittedTag] = useState('');
  const [sortKey, setSortKey] = useState<MemberSortKey>('role');
  const [direction, setDirection] = useState<SortDirection>('desc');
  // Recherche par pseudo/tag (audit UX du 2026-08-02, US-8) : retrouver un
  // joueur precis dans 47+ lignes n'etait possible qu'a l'oeil.
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedPlayerTag, setSelectedPlayerTag] = useState<string | null>(null);

  const clanState = useApiResource<unknown>(clanPath);
  // Ne charge la guerre en cours et l'historique qu'une fois le clan confirme :
  // sinon un tag valide mais inexistant declenche 3 requetes vouees au 404,
  // affichees comme 3 alertes redondantes au lieu d'une seule.
  const clanConfirmed = clanState.status === 'success';
  const warState = useApiResource<unknown>(
    clanConfirmed && clanPath !== null ? `${clanPath}/currentriverrace` : null,
  );
  const logState = useApiResource<unknown>(
    clanConfirmed && clanPath !== null ? `${clanPath}/riverracelog` : null,
  );

  // Au chargement : un tag valide dans l'URL (lien partage) prime sur le
  // dernier tag memorise en localStorage.
  useEffect(() => {
    const tagFromUrl = readClanTagFromUrl(window.location.search);
    const tag = tagFromUrl ?? readStoredClanTag();
    if (tag !== null) {
      setDraftTag(tag);
      setSubmittedTag(tag);
      setClanPath(`/api/clans/${toApiTagSegment(tag)}`);
    }
  }, []);

  const draftIsValid = isValidClanTag(draftTag);
  const debouncedDraftTag = useDebouncedValue(draftTag, FORMAT_ERROR_DEBOUNCE_MS);
  const showFormatError =
    debouncedDraftTag.length > 0 && !isValidClanTag(debouncedDraftTag);

  const summary = useMemo(
    () => (clanState.status === 'success' ? parseClanSummary(clanState.data) : null),
    [clanState],
  );

  useEffect(() => {
    if (summary !== null) {
      document.title = `${summary.name} | Clan War Inspector`;
    }
  }, [summary]);

  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const sortedMembers = useMemo(
    () => sortMembers(members, sortKey, direction),
    [members, sortKey, direction],
  );
  const visibleMembers = useMemo(
    () => filterMembersByQuery(sortedMembers, memberQuery),
    [sortedMembers, memberQuery],
  );
  const memberTags = useMemo(() => members.map((member) => member.tag), [members]);
  const attendance = useMemo(
    () =>
      logState.status === 'success'
        ? buildClanWarHistory(logState.data, submittedTag).players
        : [],
    [logState, submittedTag],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClanPath(`/api/clans/${toApiTagSegment(draftTag)}`);
    setSubmittedTag(draftTag);
    setMemberQuery('');
    storeClanTag(draftTag);
    writeClanTagToUrl(draftTag);
  }

  function handleSortChange(key: MemberSortKey) {
    if (key === sortKey) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setDirection('asc');
  }

  return (
    <div className="space-y-12">
      {clanState.status === 'success' && <SectionNav />}

      <HallOfFameSection logState={logState} clanTag={submittedTag} />

      <section
        id="membres"
        aria-labelledby="dashboard-title"
        className="scroll-mt-16 space-y-6"
      >
        <h2
          id="dashboard-title"
          className="text-royale-parchment font-display text-xl tracking-wide"
        >
          Membres du clan
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-3"
          aria-label="Recherche de clan"
        >
          <label className="flex flex-col gap-1">
            <span className="text-royale-parchment-dim text-sm">Tag du clan</span>
            <input
              type="text"
              value={draftTag}
              onChange={(event) => setDraftTag(event.target.value)}
              placeholder="#20J20QG"
              className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment rounded-md border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={!draftIsValid}
            className="bg-royale-gold-400 text-royale-navy-950 rounded-md px-4 py-2 font-semibold disabled:opacity-40"
          >
            Inspecter
          </button>
          <p className="text-royale-parchment-dim w-full text-xs">
            Le tag de votre clan est visible dans Clash Royale, sous son nom, sur l ecran
            du clan.
          </p>
          {showFormatError && (
            <p className="text-royale-red-500 w-full text-sm">
              Tag invalide : caracteres autorises 0289PYLQGRJCUV, longueur 3 a 14.
            </p>
          )}
        </form>

        {clanState.status === 'idle' && (
          <p className="text-royale-parchment-dim">
            Saisissez le tag de votre clan pour afficher ses membres.
          </p>
        )}

        {clanState.status === 'loading' && (
          <p role="status" className="text-royale-parchment-dim">
            Chargement du clan...
          </p>
        )}

        {clanState.status === 'error' && (
          <div className="space-y-2">
            <p role="alert" className="text-royale-red-500">
              {clanState.message}
            </p>
            <button
              type="button"
              onClick={clanState.refetch}
              className="border-royale-gold-400 text-royale-gold-400 rounded-md border px-3 py-1 text-sm font-semibold"
            >
              Reessayer
            </button>
          </div>
        )}

        {summary !== null && <ClanHeader summary={summary} />}

        {clanState.status === 'success' && sortedMembers.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-royale-parchment-dim text-sm">
              Rechercher un membre
            </span>
            <input
              type="search"
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Pseudo ou tag..."
              className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment w-full max-w-xs rounded-md border px-3 py-2"
            />
          </label>
        )}

        {clanState.status === 'success' &&
          (sortedMembers.length === 0 ? (
            <p className="text-royale-parchment-dim">Ce clan ne compte aucun membre.</p>
          ) : visibleMembers.length === 0 ? (
            <p className="text-royale-parchment-dim">
              Aucun membre ne correspond a « {memberQuery} ».
            </p>
          ) : (
            <MembersTable
              members={visibleMembers}
              sortKey={sortKey}
              direction={direction}
              onSortChange={handleSortChange}
              onSelectMember={setSelectedPlayerTag}
            />
          ))}
      </section>

      <CurrentWarSection warState={warState} memberTags={memberTags} />

      <WarHistorySection
        logState={logState}
        clanTag={submittedTag}
        currentMemberTags={memberTags}
      />

      <HrAssistantSection
        members={members}
        attendance={attendance}
        logState={logState}
        warState={warState}
      />

      <PurgeSection
        members={members}
        attendance={attendance}
        ready={clanState.status === 'success' && logState.status === 'success'}
      />

      <PlayerDrawer tag={selectedPlayerTag} onClose={() => setSelectedPlayerTag(null)} />
    </div>
  );
}
