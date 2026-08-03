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
        className="border-royale-blue-800 bg-royale-navy-900 flex w-full flex-col gap-2 rounded-lg border p-4 text-left"
      >
        <div>
          <p className="text-royale-parchment font-semibold">{member.name}</p>
          <p className="text-royale-parchment-dim text-xs">{member.tag}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <dt className="text-royale-parchment-dim uppercase">Role</dt>
            <dd className="text-royale-parchment">{ROLE_LABELS[member.role]}</dd>
          </div>
          <div>
            <dt className="text-royale-parchment-dim uppercase">Trophees</dt>
            <dd className="text-royale-parchment flex items-center justify-center gap-1 tabular-nums">
              <TrophyIcon className="text-royale-gold-400 h-4 w-4" />
              {member.trophies}
            </dd>
          </div>
          <div>
            <dt className="text-royale-parchment-dim uppercase">Dons</dt>
            <dd className="text-royale-parchment tabular-nums">{member.donations}</dd>
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
    <div>
      {/* Vue carte mobile (US 14.2) : le tableau reste reserve a partir de
          `md` (souris/trackpad), comme pour l'historique (US 14.1). */}
      <div className="space-y-3 md:hidden">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-royale-parchment-dim tracking-wide uppercase">
            Trier par
          </span>
          <select
            value={selectValue}
            onChange={(event) => handleSelectChange(event.target.value)}
            className="border-royale-blue-800 bg-royale-navy-900 text-royale-parchment min-h-11 rounded-md border px-3 py-2"
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
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Membres du clan</caption>
          <thead>
            <tr className="border-royale-blue-800 border-b">
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
                      } ${isActive ? 'text-royale-gold-400' : 'text-royale-parchment-dim'}`}
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
                className="border-royale-blue-800/40 text-royale-parchment hover:bg-royale-blue-800/20 cursor-pointer border-b"
              >
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectMember(memberEntry.tag);
                    }}
                    className="text-left hover:underline focus-visible:underline"
                  >
                    {memberEntry.name}
                    <span className="text-royale-parchment-dim block text-xs">
                      {memberEntry.tag}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-2">{ROLE_LABELS[memberEntry.role]}</td>
                <td className="px-3 py-2 text-right">
                  <span className="flex items-center justify-end gap-1">
                    <TrophyIcon className="text-royale-gold-400 h-4 w-4" />
                    {memberEntry.trophies}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{memberEntry.donations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
