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

/**
 * Historique de guerre (river race log) au format reel de l'API :
 * 2 semaines, ordonnees de la plus recente a la plus ancienne.
 * - Joueur 4 : present semaine recente seulement (arrive en cours de route)
 * - Joueur 5 : present semaine ancienne seulement (a quitte le clan)
 */
export const FIXTURE_RIVER_RACE_LOG: RiverRaceLog = {
  items: [
    {
      seasonId: 107,
      sectionIndex: 3,
      createdDate: '20260727T093602.000Z',
      standings: [
        {
          rank: 1,
          trophyChange: 200,
          clan: {
            tag: '#20PP',
            name: 'Test Clan',
            participants: [
              {
                tag: '#PLAYER1',
                name: 'Joueur 1',
                fame: 3200,
                repairPoints: 0,
                boatAttacks: 5,
                decksUsed: 16,
                decksUsedToday: 0,
              },
              {
                tag: '#PLAYER2',
                name: 'Joueur 2',
                fame: 2100,
                repairPoints: 0,
                boatAttacks: 2,
                decksUsed: 12,
                decksUsedToday: 0,
              },
              {
                tag: '#PLAYER3',
                name: 'Joueur 3',
                fame: 800,
                repairPoints: 0,
                boatAttacks: 0,
                decksUsed: 5,
                decksUsedToday: 0,
              },
              {
                tag: '#PLAYER4',
                name: 'Joueur 4',
                fame: 0,
                repairPoints: 0,
                boatAttacks: 0,
                decksUsed: 0,
                decksUsedToday: 0,
              },
            ],
          },
        },
        {
          rank: 2,
          trophyChange: 100,
          clan: {
            tag: '#RIVAL',
            name: 'Clan Rival',
            participants: [
              {
                tag: '#ENEMY1',
                name: 'Ennemi 1',
                fame: 2000,
                repairPoints: 0,
                boatAttacks: 1,
                decksUsed: 14,
                decksUsedToday: 0,
              },
            ],
          },
        },
      ],
    },
    {
      seasonId: 107,
      sectionIndex: 2,
      createdDate: '20260720T093602.000Z',
      standings: [
        {
          rank: 3,
          trophyChange: -100,
          clan: {
            tag: '#20PP',
            name: 'Test Clan',
            participants: [
              {
                tag: '#PLAYER1',
                name: 'Joueur 1',
                fame: 3300,
                repairPoints: 0,
                boatAttacks: 4,
                decksUsed: 16,
                decksUsedToday: 0,
              },
              {
                tag: '#PLAYER2',
                name: 'Joueur 2',
                fame: 1700,
                repairPoints: 0,
                boatAttacks: 1,
                decksUsed: 9,
                decksUsedToday: 0,
              },
              {
                tag: '#PLAYER5',
                name: 'Ancien Membre',
                fame: 400,
                repairPoints: 0,
                boatAttacks: 0,
                decksUsed: 3,
                decksUsedToday: 0,
              },
            ],
          },
        },
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
