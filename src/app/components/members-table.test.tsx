import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import { MembersTable } from './members-table';

const members: ClanMember[] = [
  {
    tag: '#A',
    name: 'Alice',
    role: 'leader',
    expLevel: 14,
    trophies: 6000,
    donations: 100,
  },
];

describe('MembersTable', () => {
  it('ouvre le panneau du joueur au clic sur la ligne', async () => {
    const user = userEvent.setup();
    const onSelectMember = vi.fn();
    render(
      <MembersTable
        members={members}
        sortKey="name"
        direction="asc"
        onSortChange={() => undefined}
        onSelectMember={onSelectMember}
      />,
    );
    await user.click(screen.getByTestId('member-row'));
    expect(onSelectMember).toHaveBeenCalledExactlyOnceWith('#A');
  });

  it('ouvre le panneau au clic sur le nom sans declencher deux fois la ligne', async () => {
    const user = userEvent.setup();
    const onSelectMember = vi.fn();
    render(
      <MembersTable
        members={members}
        sortKey="name"
        direction="asc"
        onSortChange={() => undefined}
        onSelectMember={onSelectMember}
      />,
    );
    await user.click(screen.getByRole('button', { name: /alice/i }));
    expect(onSelectMember).toHaveBeenCalledExactlyOnceWith('#A');
  });
});
