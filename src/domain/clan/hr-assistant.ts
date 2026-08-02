/**
 * Assistant "Ressources Humaines" (US 7) : suggere promotions et
 * retrogradations selon des criteres objectifs, plutot que de faire
 * chercher le chef de clan a la main.
 *
 * Logique pure : combine les membres actuels (`domain/clan/members`) et
 * l'assiduite de guerre (`domain/war/war-history`, `domain/war/current-war`).
 */

import type { ClanMember } from './members';
import type { PlayerAttendance } from '../war/war-history';

/** Nombre de semaines completes exigees pour le filtre "meritants". */
const MERIT_REQUIRED_WEEKS = 3;
/** Combats attendus par semaine (US 4.2) : le maximum, jamais moins pour un meritant. */
const MERIT_REQUIRED_BATTLES = 16;
/** Sous ce nombre de combats (strict), l'assiduite est jugee insuffisante. */
const WATCH_THRESHOLD = 8;

function compareByNameThenTag(a: ClanMember, b: ClanMember): number {
  return a.name.localeCompare(b.name) || a.tag.localeCompare(b.tag);
}

/**
 * Membres `member` ayant joue 16/16 sur les 3 dernieres semaines completes
 * ET fait au moins 1 don cette semaine. Un historique de moins de 3
 * semaines disqualifie (impossible de prouver la regularite).
 */
export function findMeritoriousMembers(
  members: readonly ClanMember[],
  attendance: readonly PlayerAttendance[],
): ClanMember[] {
  const attendanceByTag = new Map(attendance.map((entry) => [entry.tag, entry]));

  const candidates = members.filter((member) => {
    if (member.role !== 'member' || member.donations < 1) {
      return false;
    }
    const lastWeeks = attendanceByTag
      .get(member.tag)
      ?.battlesByWeek.slice(0, MERIT_REQUIRED_WEEKS);
    if (lastWeeks === undefined || lastWeeks.length < MERIT_REQUIRED_WEEKS) {
      return false;
    }
    return lastWeeks.every((battles) => battles === MERIT_REQUIRED_BATTLES);
  });

  return [...candidates].sort(compareByNameThenTag);
}

export type WatchReason = 'CURRENT_WEEK_LOW' | 'PREVIOUS_WEEK_LOW';

export interface WatchCandidate {
  member: ClanMember;
  reasons: WatchReason[];
}

/** Forme minimale requise d'un participant a la guerre en cours. */
export interface CurrentWeekParticipant {
  tag: string;
  decksUsed: number;
}

/**
 * Membres `elder` ou `coLeader` sous 8/16 combats sur la semaine en cours
 * (guerre en cours) ou la derniere semaine complete. Une semaine sans
 * donnee disponible (pas de guerre en cours, historique absent, joueur
 * non membre cette semaine-la) n'est simplement pas evaluee : elle ne
 * disqualifie ni ne blanchit le joueur.
 */
export function findWatchlistMembers(
  members: readonly ClanMember[],
  attendance: readonly PlayerAttendance[],
  currentWeekParticipants: readonly CurrentWeekParticipant[],
): WatchCandidate[] {
  const attendanceByTag = new Map(attendance.map((entry) => [entry.tag, entry]));
  const currentWeekByTag = new Map(
    currentWeekParticipants.map((entry) => [entry.tag, entry.decksUsed]),
  );

  const candidates: WatchCandidate[] = [];
  for (const member of members) {
    if (member.role !== 'elder' && member.role !== 'coLeader') {
      continue;
    }

    const reasons: WatchReason[] = [];
    const currentWeek = currentWeekByTag.get(member.tag);
    if (currentWeek !== undefined && currentWeek < WATCH_THRESHOLD) {
      reasons.push('CURRENT_WEEK_LOW');
    }
    const previousWeek = attendanceByTag.get(member.tag)?.battlesByWeek[0];
    if (
      previousWeek !== undefined &&
      previousWeek !== null &&
      previousWeek < WATCH_THRESHOLD
    ) {
      reasons.push('PREVIOUS_WEEK_LOW');
    }

    if (reasons.length > 0) {
      candidates.push({ member, reasons });
    }
  }

  return candidates.sort((a, b) => compareByNameThenTag(a.member, b.member));
}
