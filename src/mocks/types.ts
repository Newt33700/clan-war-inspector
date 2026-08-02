/**
 * Types pour les données mockées de l'API Supercell.
 */

export interface PlayerInfo {
  tag: string;
  name: string;
  expLevel: number;
  trophies: number;
  donations: number;
  role: 'leader' | 'coLeader' | 'elder' | 'member';
}

export interface ClanInfo {
  tag: string;
  name: string;
  type: string;
  description: string;
  badgeUrls: {
    small: string;
    large: string;
    medium: string;
  };
  clanScore: number;
  clanWarTrophies: number;
  location: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode: string;
  };
  members: number;
  memberList: PlayerInfo[];
}

export interface RiverRaceParticipant {
  tag: string;
  name: string;
  wins: number;
}

export interface RiverRaceStanding {
  clan: {
    tag: string;
    name: string;
    badgeUrls: { small: string; large: string; medium: string };
  };
  clanScore: number;
  participants: RiverRaceParticipant[];
}

export interface RiverRaceLog {
  seasonId: number;
  createdDate: string;
  finishTime?: string;
  standings: RiverRaceStanding[];
}

export interface RiverRace {
  state: 'notInWar' | 'preparation' | 'war' | 'collectionDay' | 'riverRace';
  clan: {
    tag: string;
    name: string;
    participants: {
      tag: string;
      name: string;
      decksUsedToday?: number;
      decksUsed?: number;
      wins?: number;
    }[];
  };
  colosseum?: {
    tag: string;
    name: string;
  };
}
