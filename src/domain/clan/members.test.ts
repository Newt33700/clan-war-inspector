/**
 * Tests du parsing des membres (US 3.1) et du tri (US 3.2).
 * Le tri est dans le perimetre Stryker : chaque comparateur, chaque
 * direction et chaque tie-break est verrouille par un ordre exact attendu.
 */

import { describe, expect, it } from 'vitest';
import {
  filterMembersByQuery,
  parseClanMembers,
  ROLE_LABELS,
  ROLE_RANK,
  sortMembers,
  type ClanMember,
} from './members';
import { FIXTURE_FULL_CLAN } from '@/mocks/fixtures';

function member(overrides: Partial<ClanMember>): ClanMember {
  return {
    tag: '#TAG',
    name: 'Nom',
    role: 'member',
    expLevel: 10,
    trophies: 5000,
    donations: 100,
    ...overrides,
  };
}

describe('ROLE_RANK', () => {
  it('ordonne chef > adjoint > aine > membre', () => {
    expect(ROLE_RANK.leader).toBeGreaterThan(ROLE_RANK.coLeader);
    expect(ROLE_RANK.coLeader).toBeGreaterThan(ROLE_RANK.elder);
    expect(ROLE_RANK.elder).toBeGreaterThan(ROLE_RANK.member);
  });
});

describe('ROLE_LABELS', () => {
  it('fournit un libelle francais distinct par role', () => {
    const labels = Object.values(ROLE_LABELS);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('parseClanMembers', () => {
  it('extrait les membres de la fixture realiste', () => {
    const members = parseClanMembers(FIXTURE_FULL_CLAN);
    expect(members).toHaveLength(3);
    expect(members[0]).toEqual({
      tag: '#PLAYER1',
      name: 'Joueur 1',
      role: 'leader',
      expLevel: 13,
      trophies: 7000,
      donations: 500,
    });
  });

  it.each([
    ['null', null],
    ['nombre', 42],
    ['objet sans memberList', {}],
    ['memberList non tableau', { memberList: 'oops' }],
  ])('retourne [] pour une reponse inexploitable (%s)', (_label, raw) => {
    expect(parseClanMembers(raw)).toEqual([]);
  });

  it.each([
    ['entree non objet', 'oops'],
    ['entree null', null],
    ['tag manquant', { name: 'X' }],
    ['tag vide', { tag: '   ' }],
  ])('ignore une entree inutilisable (%s)', (_label, entry) => {
    expect(parseClanMembers({ memberList: [entry] })).toEqual([]);
  });

  it('canonicalise le tag du membre', () => {
    const members = parseClanMembers({ memberList: [{ tag: ' p1uu ' }] });
    expect(members[0]?.tag).toBe('#P1UU');
  });

  it('remplace un nom manquant ou vide par le tag', () => {
    const members = parseClanMembers({
      memberList: [{ tag: '#P1' }, { tag: '#P2', name: '' }],
    });
    expect(members.map((m) => m.name)).toEqual(['#P1', '#P2']);
  });

  it.each(['leader', 'coLeader', 'elder', 'member'] as const)(
    'conserve le role connu %s',
    (role) => {
      const members = parseClanMembers({ memberList: [{ tag: '#P1', role }] });
      expect(members[0]?.role).toBe(role);
    },
  );

  it('retombe sur member pour un role inconnu ou manquant', () => {
    const members = parseClanMembers({
      memberList: [{ tag: '#P1', role: 'admin' }, { tag: '#P2' }],
    });
    expect(members.map((m) => m.role)).toEqual(['member', 'member']);
  });

  it('borne les valeurs numeriques manquantes ou aberrantes a 0', () => {
    const members = parseClanMembers({
      memberList: [{ tag: '#P1', expLevel: 'oops', trophies: -5, donations: Number.NaN }],
    });
    expect(members[0]).toMatchObject({
      expLevel: 0,
      trophies: 0,
      donations: 0,
    });
  });

  it('coerce un niveau serialise en chaine (audit UX 2026-08-02, US-4)', () => {
    // Reproduit le bug observe en production : la colonne "Niveau" affichait
    // 0 pour tous les membres alors que la fiche joueur montrait la bonne
    // valeur pour le meme champ `expLevel`.
    const members = parseClanMembers({
      memberList: [{ tag: '#P1', expLevel: '62' }],
    });
    expect(members[0]?.expLevel).toBe(62);
  });

  it('tronque les valeurs numeriques fractionnaires', () => {
    const members = parseClanMembers({
      memberList: [{ tag: '#P1', trophies: 5000.9 }],
    });
    expect(members[0]?.trophies).toBe(5000);
  });
});

describe('sortMembers', () => {
  const alice = member({
    tag: '#A',
    name: 'Alice',
    trophies: 5000,
    donations: 10,
    expLevel: 11,
    role: 'elder',
  });
  const bob = member({
    tag: '#B',
    name: 'Bob',
    trophies: 7000,
    donations: 0,
    expLevel: 14,
    role: 'leader',
  });
  const carol = member({
    tag: '#C',
    name: 'Carol',
    trophies: 6000,
    donations: 300,
    expLevel: 12,
    role: 'coLeader',
  });
  const dave = member({
    tag: '#D',
    name: 'Dave',
    trophies: 4000,
    donations: 50,
    expLevel: 13,
    role: 'member',
  });

  const roster = [alice, bob, carol, dave];

  it('ne mute pas le tableau d entree', () => {
    const input = [bob, alice];
    sortMembers(input, 'name', 'asc');
    expect(input).toEqual([bob, alice]);
  });

  it('trie par nom ascendant', () => {
    expect(
      sortMembers([carol, bob, dave, alice], 'name', 'asc').map((m) => m.name),
    ).toEqual(['Alice', 'Bob', 'Carol', 'Dave']);
  });

  it('trie par nom descendant', () => {
    expect(sortMembers(roster, 'name', 'desc').map((m) => m.name)).toEqual([
      'Dave',
      'Carol',
      'Bob',
      'Alice',
    ]);
  });

  it('trie par trophees ascendant', () => {
    expect(sortMembers(roster, 'trophies', 'asc').map((m) => m.trophies)).toEqual([
      4000, 5000, 6000, 7000,
    ]);
  });

  it('trie par trophees descendant', () => {
    expect(sortMembers(roster, 'trophies', 'desc').map((m) => m.trophies)).toEqual([
      7000, 6000, 5000, 4000,
    ]);
  });

  it('trie par niveau ascendant', () => {
    expect(sortMembers(roster, 'expLevel', 'asc').map((m) => m.expLevel)).toEqual([
      11, 12, 13, 14,
    ]);
  });

  it('trie par dons descendant', () => {
    expect(sortMembers(roster, 'donations', 'desc').map((m) => m.donations)).toEqual([
      300, 50, 10, 0,
    ]);
  });

  it('trie les roles selon la hierarchie metier, pas l alphabet', () => {
    // Alphabetiquement : coLeader < elder < leader < member.
    // Hierarchie metier descendante attendue : chef, adjoint, aine, membre.
    expect(sortMembers(roster, 'role', 'desc').map((m) => m.role)).toEqual([
      'leader',
      'coLeader',
      'elder',
      'member',
    ]);
  });

  it('trie les roles ascendant du membre vers le chef', () => {
    expect(sortMembers(roster, 'role', 'asc').map((m) => m.role)).toEqual([
      'member',
      'elder',
      'coLeader',
      'leader',
    ]);
  });

  it('departage les ex-aequo par nom ascendant, meme en direction desc', () => {
    const tieA = member({ tag: '#T1', name: 'Zoe', trophies: 5000 });
    const tieB = member({ tag: '#T2', name: 'Anna', trophies: 5000 });
    const sorted = sortMembers([tieA, tieB], 'trophies', 'desc');
    expect(sorted.map((m) => m.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage les homonymes par tag ascendant', () => {
    const twinB = member({ tag: '#ZZ', name: 'Jumeau', trophies: 5000 });
    const twinA = member({ tag: '#AA', name: 'Jumeau', trophies: 5000 });
    const sorted = sortMembers([twinB, twinA], 'trophies', 'asc');
    expect(sorted.map((m) => m.tag)).toEqual(['#AA', '#ZZ']);
  });

  it('applique le tie-break nom avant le tie-break tag', () => {
    const first = member({ tag: '#ZZ', name: 'Alpha', trophies: 5000 });
    const second = member({ tag: '#AA', name: 'Beta', trophies: 5000 });
    const sorted = sortMembers([second, first], 'trophies', 'asc');
    expect(sorted.map((m) => m.name)).toEqual(['Alpha', 'Beta']);
  });
});

describe('filterMembersByQuery (audit UX 2026-08-02, US-8)', () => {
  const alice = member({ tag: '#ALICE1', name: 'Alice' });
  const bob = member({ tag: '#BOB2', name: 'Bob' });
  const roster = [alice, bob];

  it('retourne tous les membres pour une requete vide ou blanche', () => {
    expect(filterMembersByQuery(roster, '')).toEqual(roster);
    expect(filterMembersByQuery(roster, '   ')).toEqual(roster);
  });

  it('filtre par sous-chaine du pseudo, insensible a la casse', () => {
    expect(filterMembersByQuery(roster, 'ali').map((m) => m.name)).toEqual(['Alice']);
    expect(filterMembersByQuery(roster, 'ALI').map((m) => m.name)).toEqual(['Alice']);
  });

  it('filtre par sous-chaine du tag', () => {
    expect(filterMembersByQuery(roster, 'bob2').map((m) => m.name)).toEqual(['Bob']);
  });

  it('retourne un tableau vide sans correspondance', () => {
    expect(filterMembersByQuery(roster, 'zzz')).toEqual([]);
  });

  it('ne mute pas le tableau d entree', () => {
    const input = [...roster];
    filterMembersByQuery(input, 'alice');
    expect(input).toEqual(roster);
  });
});
