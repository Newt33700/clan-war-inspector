import { render, screen, within } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClanMember } from '@/domain/clan/members';
import { MembersTable } from './members-table';

const members: ClanMember[] = [
  {
    tag: '#A',
    name: 'Alice',
    role: 'leader',
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
        onSortSelect={() => undefined}
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
        onSortSelect={() => undefined}
        onSelectMember={onSelectMember}
      />,
    );
    // Le tableau desktop et les cartes mobiles (US 14.2) coexistent dans le
    // DOM (bascule au CSS) : on scope au tableau, seul concerne ici.
    await user.click(
      within(screen.getByRole('table')).getByRole('button', { name: /alice/i }),
    );
    expect(onSelectMember).toHaveBeenCalledExactlyOnceWith('#A');
  });

  describe('US 14.2 : vue carte mobile', () => {
    const twoMembers: ClanMember[] = [
      members[0]!,
      {
        tag: '#B',
        name: 'Bob',
        role: 'member',
        trophies: 4000,
        donations: 20,
      },
    ];

    it('affiche uniquement le pseudo et le role tant que la carte est fermee', () => {
      render(
        <MembersTable
          members={members}
          sortKey="name"
          direction="asc"
          onSortChange={() => undefined}
          onSortSelect={() => undefined}
          onSelectMember={() => undefined}
        />,
      );

      const card = screen.getByTestId('member-card');
      expect(within(card).getByText('Alice')).toBeInTheDocument();
      expect(within(card).getByText('Chef')).toBeInTheDocument();
      expect(within(card).queryByText('#A')).not.toBeInTheDocument();
      expect(within(card).queryByText('6000')).not.toBeInTheDocument();
      expect(within(card).queryByText('100')).not.toBeInTheDocument();
    });

    it('deplie le tag, les trophees et les dons au tap sur la carte', async () => {
      const user = userEvent.setup();
      render(
        <MembersTable
          members={members}
          sortKey="name"
          direction="asc"
          onSortChange={() => undefined}
          onSortSelect={() => undefined}
          onSelectMember={() => undefined}
        />,
      );

      const card = screen.getByTestId('member-card');
      await user.click(within(card).getByRole('button', { name: /alice/i }));

      expect(within(card).getByText('#A')).toBeInTheDocument();
      expect(within(card).getByText('6000')).toBeInTheDocument();
      expect(within(card).getByText('100')).toBeInTheDocument();
    });

    it('ouvre le panneau joueur via "Voir le profil complet" dans la carte depliee', async () => {
      const user = userEvent.setup();
      const onSelectMember = vi.fn();
      render(
        <MembersTable
          members={members}
          sortKey="name"
          direction="asc"
          onSortChange={() => undefined}
          onSortSelect={() => undefined}
          onSelectMember={onSelectMember}
        />,
      );

      const card = screen.getByTestId('member-card');
      await user.click(within(card).getByRole('button', { name: /alice/i }));
      await user.click(
        within(card).getByRole('button', { name: /voir le profil complet/i }),
      );

      expect(onSelectMember).toHaveBeenCalledExactlyOnceWith('#A');
    });

    it('trie via le selecteur mobile', async () => {
      const user = userEvent.setup();
      const onSortSelect = vi.fn();
      render(
        <MembersTable
          members={twoMembers}
          sortKey="role"
          direction="desc"
          onSortChange={() => undefined}
          onSortSelect={onSortSelect}
          onSelectMember={() => undefined}
        />,
      );

      await user.selectOptions(
        screen.getByRole('combobox', { name: /trier par/i }),
        'trophies-desc',
      );

      expect(onSortSelect).toHaveBeenCalledExactlyOnceWith('trophies', 'desc');
    });
  });
});
