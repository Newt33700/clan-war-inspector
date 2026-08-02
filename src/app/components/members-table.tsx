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

const COLUMNS: { key: MemberSortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Joueur', numeric: false },
  { key: 'role', label: 'Role', numeric: false },
  { key: 'expLevel', label: 'Niveau', numeric: true },
  { key: 'trophies', label: 'Trophees', numeric: true },
  { key: 'donations', label: 'Dons', numeric: true },
];

interface MembersTableProps {
  members: ClanMember[];
  sortKey: MemberSortKey;
  direction: SortDirection;
  onSortChange: (key: MemberSortKey) => void;
}

export function MembersTable({
  members,
  sortKey,
  direction,
  onSortChange,
}: MembersTableProps) {
  return (
    <div className="overflow-x-auto">
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
                    isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
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
              className="border-royale-blue-800/40 text-royale-parchment border-b"
            >
              <td className="px-3 py-2">
                {memberEntry.name}
                <span className="text-royale-parchment-dim block text-xs">
                  {memberEntry.tag}
                </span>
              </td>
              <td className="px-3 py-2">{ROLE_LABELS[memberEntry.role]}</td>
              <td className="px-3 py-2 text-right">{memberEntry.expLevel}</td>
              <td className="px-3 py-2 text-right">{memberEntry.trophies}</td>
              <td className="px-3 py-2 text-right">{memberEntry.donations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
