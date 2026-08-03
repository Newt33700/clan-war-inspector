import { render, screen, within } from '@testing-library/react';
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

  it('affiche un tiret plutot que 0 quand le niveau est indisponible (clan reel #20J20QG)', () => {
    // /clans/{tag} renvoie expLevel: 0 pour tous les membres en prod ;
    // afficher "0" laisserait croire a un vrai niveau 0, impossible dans le jeu.
    const unavailable: ClanMember[] = [{ ...members[0]!, expLevel: 0 }];
    render(
      <MembersTable
        members={unavailable}
        sortKey="name"
        direction="asc"
        onSortChange={() => undefined}
        onSortSelect={() => undefined}
        onSelectMember={() => undefined}
      />,
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('—')).toBeInTheDocument();
    expect(within(table).queryByText('0')).not.toBeInTheDocument();
  });

  describe('US 14.2 : vue carte mobile', () => {
    const twoMembers: ClanMember[] = [
      members[0]!,
      {
        tag: '#B',
        name: 'Bob',
        role: 'member',
        expLevel: 0,
        trophies: 4000,
        donations: 20,
      },
    ];

    it('affiche une carte par membre avec nom, tag, role, niveau, trophees et dons', () => {
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
      expect(within(card).getByText('#A')).toBeInTheDocument();
      expect(within(card).getByText('Chef')).toBeInTheDocument();
      expect(within(card).getByText('14')).toBeInTheDocument();
      expect(within(card).getByText('6000')).toBeInTheDocument();
      expect(within(card).getByText('100')).toBeInTheDocument();
    });

    it('ouvre le panneau joueur au clic sur une carte', async () => {
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

      await user.click(screen.getByTestId('member-card'));

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
