'use client';

/**
 * Dashboard membres (US 3.1) : saisie du tag de clan, chargement via le
 * proxy, tableau triable. Les etats charge / erreur / clan vide sont
 * geres explicitement.
 */

import { useMemo, useState } from 'react';
import { isValidClanTag, toApiTagSegment } from '@/domain/clan/clan-tag';
import {
  parseClanMembers,
  sortMembers,
  type MemberSortKey,
  type SortDirection,
} from '@/domain/clan/members';
import { useApiResource } from '@/hooks/use-api-resource';
import { MembersTable } from './members-table';
import { WarHistorySection } from './war-history-section';

export function ClanDashboard() {
  const [draftTag, setDraftTag] = useState('');
  const [clanPath, setClanPath] = useState<string | null>(null);
  const [submittedTag, setSubmittedTag] = useState('');
  const [sortKey, setSortKey] = useState<MemberSortKey>('role');
  const [direction, setDirection] = useState<SortDirection>('desc');

  const clanState = useApiResource<unknown>(clanPath);
  const draftIsValid = isValidClanTag(draftTag);

  const members = useMemo(
    () => (clanState.status === 'success' ? parseClanMembers(clanState.data) : []),
    [clanState],
  );
  const sortedMembers = useMemo(
    () => sortMembers(members, sortKey, direction),
    [members, sortKey, direction],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClanPath(`/api/clans/${toApiTagSegment(draftTag)}`);
    setSubmittedTag(draftTag);
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

      <WarHistorySection clanPath={clanPath} clanTag={submittedTag} />
    </section>
  );
}
