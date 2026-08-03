'use client';

/**
 * Tableau des membres du clan (US 3.1) avec en-tetes triables (US 3.2).
 * La logique de tri vit dans domain/clan/members ; ce composant ne fait
 * que restituer et relayer les clics.
 */

import {
  ROLE_LABELS,
  type ClanMember,
  type MemberSortKey,
  type SortDirection,
} from '@/domain/clan/members';

import { TrophyIcon } from './section-icons';

const COLUMNS: { key: MemberSortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Joueur', numeric: false },
  { key: 'role', label: 'Role', numeric: false },
  { key: 'trophies', label: 'Trophees', numeric: true },
  { key: 'donations', label: 'Dons', numeric: true },
];

/** Options du selecteur de tri mobile (US 14.2), une par colonne x sens. */
const SORT_SELECT_OPTIONS: {
  value: string;
  key: MemberSortKey;
  direction: SortDirection;
  label: string;
}[] = [
  { value: 'name-asc', key: 'name', direction: 'asc', label: 'Joueur (A-Z)' },
  { value: 'name-desc', key: 'name', direction: 'desc', label: 'Joueur (Z-A)' },
  { value: 'role-desc', key: 'role', direction: 'desc', label: 'Role (chef en premier)' },
  {
    value: 'trophies-desc',
    key: 'trophies',
    direction: 'desc',
    label: 'Trophees (decroissant)',
  },
  {
    value: 'donations-desc',
    key: 'donations',
    direction: 'desc',
    label: 'Dons (decroissant)',
  },
];

interface MembersTableProps {
  members: ClanMember[];
  sortKey: MemberSortKey;
  direction: SortDirection;
  onSortChange: (key: MemberSortKey) => void;
  /** Tri absolu depuis le selecteur mobile (US 14.2), plutot qu'un simple
   * changement de colonne a basculer comme `onSortChange`. */
  onSortSelect: (key: MemberSortKey, direction: SortDirection) => void;
  /** Ouvre le panneau d'inspection du joueur (US 9). */
  onSelectMember: (tag: string) => void;
}

function MemberCard({
  member,
  onSelectMember,
}: {
  member: ClanMember;
  onSelectMember: (tag: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-testid="member-card"
        onClick={() => onSelectMember(member.tag)}
        className="cr-pill-row flex w-full flex-col gap-2 p-4 text-left"
      >
        <div>
          <p className="font-display font-semibold text-slate-900">{member.name}</p>
          <p className="text-xs text-slate-500">{member.tag}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <dt className="text-slate-500 uppercase">Role</dt>
            <dd className="text-slate-900">{ROLE_LABELS[member.role]}</dd>
          </div>
          <div>
            <dt className="text-slate-500 uppercase">Trophees</dt>
            <dd className="font-display flex items-center justify-center gap-1 text-slate-900 tabular-nums">
              <TrophyIcon className="text-cr-gold h-4 w-4" />
              {member.trophies}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 uppercase">Dons</dt>
            <dd className="font-display text-slate-900 tabular-nums">
              {member.donations}
            </dd>
          </div>
        </dl>
      </button>
    </li>
  );
}

export function MembersTable({
  members,
  sortKey,
  direction,
  onSortChange,
  onSortSelect,
  onSelectMember,
}: MembersTableProps) {
  const selectValue =
    SORT_SELECT_OPTIONS.find(
      (option) => option.key === sortKey && option.direction === direction,
    )?.value ?? SORT_SELECT_OPTIONS[0]!.value;

  function handleSelectChange(value: string) {
    const option = SORT_SELECT_OPTIONS.find((candidate) => candidate.value === value);
    if (option !== undefined) {
      onSortSelect(option.key, option.direction);
    }
  }

  return (
    <div className="bg-cr-panel-light space-y-3 rounded-lg border-2 border-black p-3">
      {/* Vue carte mobile (US 14.2) : le tableau reste reserve a partir de
          `md` (souris/trackpad), comme pour l'historique (US 14.1). */}
      <div className="space-y-3 md:hidden">
        <label className="flex flex-col gap-1 text-xs">
          <span className="tracking-wide text-slate-600 uppercase">Trier par</span>
          <select
            value={selectValue}
            onChange={(event) => handleSelectChange(event.target.value)}
            className="min-h-11 rounded-md border border-black bg-white px-3 py-2 text-slate-900"
          >
            {SORT_SELECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <ul className="space-y-3">
          {members.map((member) => (
            <MemberCard
              key={member.tag}
              member={member}
              onSelectMember={onSelectMember}
            />
          ))}
        </ul>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <caption className="sr-only">Membres du clan</caption>
          <thead>
            <tr>
              {COLUMNS.map((column) => {
                const isActive = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      isActive
                        ? direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    className={`p-0 ${column.numeric ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className={`w-full px-3 py-2 font-semibold tracking-wide uppercase ${
                        column.numeric ? 'text-right' : 'text-left'
                      } ${isActive ? 'text-cr-blue' : 'text-slate-600'}`}
                    >
                      {column.label}
                      <span aria-hidden="true">
                        {isActive ? (direction === 'asc' ? ' ▲' : ' ▼') : ''}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members.map((memberEntry) => (
              <tr
                key={memberEntry.tag}
                data-testid="member-row"
                onClick={() => onSelectMember(memberEntry.tag)}
                className="cursor-pointer bg-gradient-to-b from-white to-slate-100 text-slate-900 hover:from-slate-50 hover:to-slate-200"
              >
                <td className="rounded-l-xl border-y-2 border-l-2 border-black px-3 py-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectMember(memberEntry.tag);
                    }}
                    className="font-display text-left hover:underline focus-visible:underline"
                  >
                    {memberEntry.name}
                    <span className="block text-xs font-normal text-slate-500">
                      {memberEntry.tag}
                    </span>
                  </button>
                </td>
                <td className="border-y-2 border-black px-3 py-2">
                  {ROLE_LABELS[memberEntry.role]}
                </td>
                <td className="font-display border-y-2 border-black px-3 py-2 text-right tabular-nums">
                  <span className="flex items-center justify-end gap-1">
                    <TrophyIcon className="text-cr-gold h-4 w-4" />
                    {memberEntry.trophies}
                  </span>
                </td>
                <td className="font-display rounded-r-xl border-y-2 border-r-2 border-black px-3 py-2 text-right tabular-nums">
                  {memberEntry.donations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
