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
  parseClanMembers,
  sortMembers,
  type MemberSortKey,
  type SortDirection,
} from '@/domain/clan/members';
import { buildClanWarHistory } from '@/domain/war/war-history';
import { useApiResource } from '@/hooks/use-api-resource';
import { ClanHeader } from './clan-header';
import { CurrentWarSection } from './current-war-section';
import { MembersTable } from './members-table';
import { PurgeSection } from './purge-section';
import { WarHistorySection } from './war-history-section';

export function ClanDashboard() {
  const [draftTag, setDraftTag] = useState('');
  const [clanPath, setClanPath] = useState<string | null>(null);
  const [submittedTag, setSubmittedTag] = useState('');
  const [sortKey, setSortKey] = useState<MemberSortKey>('role');
  const [direction, setDirection] = useState<SortDirection>('desc');

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
      <section aria-labelledby="dashboard-title" className="space-y-6">
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
              placeholder="#20PP"
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
          {draftTag.length > 0 && !draftIsValid && (
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
          <p role="alert" className="text-royale-red-500">
            {clanState.message}
          </p>
        )}

        {summary !== null && <ClanHeader summary={summary} />}

        {clanState.status === 'success' &&
          (sortedMembers.length === 0 ? (
            <p className="text-royale-parchment-dim">Ce clan ne compte aucun membre.</p>
          ) : (
            <MembersTable
              members={sortedMembers}
              sortKey={sortKey}
              direction={direction}
              onSortChange={handleSortChange}
            />
          ))}
      </section>

      <CurrentWarSection warState={warState} memberTags={memberTags} />

      <WarHistorySection
        logState={logState}
        clanTag={submittedTag}
        currentMemberTags={memberTags}
      />

      <PurgeSection
        members={members}
        attendance={attendance}
        ready={clanState.status === 'success' && logState.status === 'success'}
      />
    </div>
  );
}
