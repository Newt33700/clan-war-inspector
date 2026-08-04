/**
 * Fixtures réalistes pour les tests.
 * Basées sur les structures d'API Supercell Clash Royale.
 */

import type { ClanInfo, PlayerProfileInfo, RiverRaceLog, RiverRace } from './types';

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

/**
 * Guerre en cours, jour de bataille.
 * #PLAYER9 est inscrit a la guerre mais absent de FIXTURE_FULL_CLAN :
 * il a quitte le clan en cours de semaine (cas US 4.1).
 */
export const FIXTURE_RIVER_RACE_IN_PROGRESS: RiverRace = {
  state: 'war',
  periodType: 'warDay',
  periodIndex: 4,
  clan: {
    tag: '#20PP',
    name: 'Test Clan',
    participants: [
      { tag: '#PLAYER1', name: 'Joueur 1', decksUsedToday: 4, decksUsed: 4 },
      { tag: '#PLAYER2', name: 'Joueur 2', decksUsedToday: 2, decksUsed: 14 },
      { tag: '#PLAYER3', name: 'Joueur 3', decksUsedToday: 0, decksUsed: 5 },
      { tag: '#PLAYER9', name: 'Parti En Guerre', decksUsedToday: 0, decksUsed: 8 },
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

/** Profil detaille d'un joueur (US 9), avec un deck complet de 8 cartes. */
export const FIXTURE_PLAYER_PROFILE: PlayerProfileInfo = {
  tag: '#PLAYER1',
  name: 'Joueur 1',
  expLevel: 13,
  trophies: 7000,
  role: 'leader',
  donations: 500,
  clan: { tag: '#20PP', name: 'Test Clan' },
  currentDeck: Array.from({ length: 8 }, (_, index) => ({
    name: `Carte ${index + 1}`,
    id: 1000 + index,
    level: 11,
    maxLevel: 14,
    iconUrls: { medium: `https://example.com/cards/${index + 1}.png` },
  })),
  /** Collection complete (US carte/niveau, retour 2026-08-04) : 8 cartes sur 4 niveaux. */
  cards: [
    {
      name: 'Knight',
      id: 2000,
      level: 11,
      maxLevel: 14,
      iconUrls: { medium: 'https://example.com/cards/knight.png' },
    },
    {
      name: 'Archers',
      id: 2001,
      level: 11,
      maxLevel: 14,
      iconUrls: { medium: 'https://example.com/cards/archers.png' },
    },
    {
      name: 'Giant',
      id: 2002,
      level: 9,
      maxLevel: 13,
      iconUrls: { medium: 'https://example.com/cards/giant.png' },
    },
    {
      name: 'Fireball',
      id: 2003,
      level: 9,
      maxLevel: 13,
      iconUrls: { medium: 'https://example.com/cards/fireball.png' },
    },
    {
      name: 'Musketeer',
      id: 2004,
      level: 9,
      maxLevel: 13,
      iconUrls: { medium: 'https://example.com/cards/musketeer.png' },
    },
    {
      name: 'Mini P.E.K.K.A',
      id: 2005,
      level: 6,
      maxLevel: 11,
      iconUrls: { medium: 'https://example.com/cards/mini-pekka.png' },
    },
    {
      name: 'Balloon',
      id: 2006,
      level: 6,
      maxLevel: 11,
      iconUrls: { medium: 'https://example.com/cards/balloon.png' },
    },
    {
      name: 'Skeletons',
      id: 2007,
      level: 14,
      maxLevel: 15,
      iconUrls: { medium: 'https://example.com/cards/skeletons.png' },
    },
  ],
};

/**
 * Clan pour le "Sas de Quarantaine" (US 11) : 3 anciens membres (avec
 * historique de guerre, cf. FIXTURE_QUARANTINE_LOG) et 2 nouveaux membres
 * (absents de tout l'historique).
 */
export const FIXTURE_QUARANTINE_CLAN: ClanInfo = {
  tag: '#20QRV',
  name: 'Clan Quarantaine',
  type: 'open',
  description: 'Fixture US 11 : 3 anciens + 2 nouveaux membres',
  badgeUrls: {
    small: 'https://example.com/badges/small.png',
    large: 'https://example.com/badges/large.png',
    medium: 'https://example.com/badges/medium.png',
  },
  clanScore: 30000,
  clanWarTrophies: 8000,
  location: { id: 1, name: 'France', isCountry: true, countryCode: 'FR' },
  members: 5,
  memberList: [
    {
      tag: '#OLD1',
      name: 'Veteran 1',
      expLevel: 12,
      trophies: 6000,
      donations: 100,
      role: 'leader',
    },
    {
      tag: '#OLD2',
      name: 'Veteran 2',
      expLevel: 11,
      trophies: 5500,
      donations: 50,
      role: 'elder',
    },
    {
      tag: '#OLD3',
      name: 'Veteran 3',
      expLevel: 10,
      trophies: 5000,
      donations: 0,
      role: 'member',
    },
    {
      tag: '#NEW1',
      name: 'Recrue Risquee',
      expLevel: 8,
      trophies: 5200,
      donations: 0,
      role: 'member',
    },
    {
      tag: '#NEW2',
      name: 'Recrue Fiable',
      expLevel: 9,
      trophies: 4800,
      donations: 0,
      role: 'member',
    },
  ],
};

/**
 * Historique de guerre pour FIXTURE_QUARANTINE_CLAN : ne contient que les
 * 3 anciens membres, jamais #NEW1 ni #NEW2 (US 11).
 */
export const FIXTURE_QUARANTINE_LOG: RiverRaceLog = {
  items: [
    {
      seasonId: 200,
      sectionIndex: 5,
      createdDate: '20260727T093602.000Z',
      standings: [
        {
          rank: 1,
          trophyChange: 150,
          clan: {
            tag: '#20QRV',
            name: 'Clan Quarantaine',
            participants: [
              {
                tag: '#OLD1',
                name: 'Veteran 1',
                fame: 3000,
                repairPoints: 0,
                boatAttacks: 3,
                decksUsed: 16,
                decksUsedToday: 0,
              },
              {
                tag: '#OLD2',
                name: 'Veteran 2',
                fame: 2000,
                repairPoints: 0,
                boatAttacks: 1,
                decksUsed: 10,
                decksUsedToday: 0,
              },
              {
                tag: '#OLD3',
                name: 'Veteran 3',
                fame: 500,
                repairPoints: 0,
                boatAttacks: 0,
                decksUsed: 4,
                decksUsedToday: 0,
              },
            ],
          },
        },
      ],
    },
  ],
};

/**
 * Profil du "nouveau membre risque" (US 11) : 0 victoire GDC a vie
 * (badge `ClanWarWins`) et plus de 1000 combats -- doit produire un feu
 * rouge ("A risque").
 */
export const FIXTURE_NEW_MEMBER_RISKY_PROFILE: PlayerProfileInfo = {
  tag: '#NEW1',
  name: 'Recrue Risquee',
  expLevel: 8,
  trophies: 5200,
  donations: 0,
  battleCount: 5000,
  badges: [{ name: 'ClanWarWins', progress: 0 }],
};

/**
 * Profil du "nouveau membre fiable" (US 11) : plus de 50 victoires GDC a
 * vie -- doit produire un feu vert ("Bon profil").
 */
export const FIXTURE_NEW_MEMBER_GOOD_PROFILE: PlayerProfileInfo = {
  tag: '#NEW2',
  name: 'Recrue Fiable',
  expLevel: 9,
  trophies: 4800,
  donations: 0,
  battleCount: 2000,
  badges: [{ name: 'ClanWarWins', progress: 80 }],
};

/** Profil sans deck : repli attendu sur currentFavouriteCard. */
export const FIXTURE_PLAYER_PROFILE_NO_DECK: PlayerProfileInfo = {
  tag: '#PLAYER2',
  name: 'Joueur 2',
  expLevel: 10,
  trophies: 5000,
  role: 'member',
  donations: 0,
  currentFavouriteCard: {
    name: 'Carte Favorite',
    id: 2000,
    level: 9,
    maxLevel: 14,
    iconUrls: { medium: 'https://example.com/cards/favorite.png' },
  },
};
