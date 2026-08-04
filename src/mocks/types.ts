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
  fame: number;
  repairPoints: number;
  boatAttacks: number;
  /** Nombre de combats joues sur la semaine (0 a 16) : la donnee centrale. */
  decksUsed: number;
  decksUsedToday: number;
}

export interface RiverRaceStanding {
  rank: number;
  trophyChange: number;
  clan: {
    tag: string;
    name: string;
    participants: RiverRaceParticipant[];
  };
}

export interface RiverRaceLogEntry {
  seasonId: number;
  sectionIndex: number;
  createdDate: string;
  standings: RiverRaceStanding[];
}

/** Forme reelle de GET /clans/{tag}/riverracelog : une page d'items. */
export interface RiverRaceLog {
  items: RiverRaceLogEntry[];
}

export interface PlayerProfileCard {
  name: string;
  id: number;
  level: number;
  maxLevel: number;
  iconUrls: { medium: string };
}

/** Forme (partielle) de GET /players/{tag} utile a l'inspection (US 9). */
export interface PlayerProfileInfo {
  tag: string;
  name: string;
  expLevel: number;
  trophies: number;
  role?: string;
  donations: number;
  clan?: { tag: string; name: string };
  currentDeck?: PlayerProfileCard[];
  currentFavouriteCard?: PlayerProfileCard;
  /** Collection complete de cartes debloquees (US carte/niveau, retour 2026-08-04). */
  cards?: PlayerProfileCard[];
  /** Combats totaux, utilise par l'indice de fiabilite (US 11). */
  battleCount?: number;
  /** Contient le badge `ClanWarWins` (US 11, "le hack des badges"). */
  badges?: { name: string; progress: number }[];
}

export interface RiverRace {
  state: 'notInWar' | 'preparation' | 'war' | 'collectionDay' | 'riverRace';
  periodType?: 'training' | 'warDay' | 'colosseum';
  periodIndex?: number;
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
