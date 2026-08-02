/**
 * Fixtures réalistes pour les tests.
 * Basées sur les structures d'API Supercell Clash Royale.
 */

import type { ClanInfo, RiverRaceLog, RiverRace } from './types';

/** Clan complet avec membres. */
export const FIXTURE_FULL_CLAN: ClanInfo = {
  tag: '#20PP',
  name: 'Test Clan',
  type: 'invite only',
  description: 'A test clan for unit tests',
  badgeUrls: {
    small: 'https://example.com/badges/small.png',
    large: 'https://example.com/badges/large.png',
    medium: 'https://example.com/badges/medium.png',
  },
  clanScore: 45000,
  clanWarTrophies: 12000,
  location: {
    id: 1,
    name: 'France',
    isCountry: true,
    countryCode: 'FR',
  },
  members: 3,
  memberList: [
    {
      tag: '#PLAYER1',
      name: 'Joueur 1',
      expLevel: 13,
      trophies: 7000,
      donations: 500,
      role: 'leader',
    },
    {
      tag: '#PLAYER2',
      name: 'Joueur 2',
      expLevel: 12,
      trophies: 6500,
      donations: 300,
      role: 'elder',
    },
    {
      tag: '#PLAYER3',
      name: 'Joueur 3',
      expLevel: 11,
      trophies: 5000,
      donations: 100,
      role: 'member',
    },
  ],
};

/** Clan vide. */
export const FIXTURE_EMPTY_CLAN: ClanInfo = {
  ...FIXTURE_FULL_CLAN,
  members: 0,
  memberList: [],
};

/** Historique de guerre (river race log) avec une semaine complète. */
export const FIXTURE_RIVER_RACE_LOG: RiverRaceLog = {
  seasonId: 1,
  createdDate: '20260801T000000.000Z',
  finishTime: '20260802T000000.000Z',
  standings: [
    {
      clan: {
        tag: '#20PP',
        name: 'Test Clan',
        badgeUrls: {
          small: 'https://example.com/badges/small.png',
          large: 'https://example.com/badges/large.png',
          medium: 'https://example.com/badges/medium.png',
        },
      },
      clanScore: 1000,
      participants: [
        { tag: '#PLAYER1', name: 'Joueur 1', wins: 16 },
        { tag: '#PLAYER2', name: 'Joueur 2', wins: 12 },
        { tag: '#PLAYER3', name: 'Joueur 3', wins: 5 },
      ],
    },
  ],
};

/** Guerre en cours (state: war). */
export const FIXTURE_RIVER_RACE_IN_PROGRESS: RiverRace = {
  state: 'war',
  clan: {
    tag: '#20PP',
    name: 'Test Clan',
    participants: [
      { tag: '#PLAYER1', name: 'Joueur 1', decksUsedToday: 4, decksUsed: 4 },
      { tag: '#PLAYER2', name: 'Joueur 2', decksUsedToday: 2, decksUsed: 14 },
      { tag: '#PLAYER3', name: 'Joueur 3', decksUsedToday: 0, decksUsed: 5 },
    ],
  },
};

/** État "pas en guerre" (notInWar). */
export const FIXTURE_RIVER_RACE_IDLE: RiverRace = {
  state: 'notInWar',
  clan: {
    tag: '#20PP',
    name: 'Test Clan',
    participants: [],
  },
};
