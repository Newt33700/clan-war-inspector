/**
 * Assistant "Ressources Humaines" (US 7) : suggere promotions et
 * retrogradations selon des criteres objectifs, plutot que de faire
 * chercher le chef de clan a la main.
 *
 * Logique pure : combine les membres actuels (`domain/clan/members`) et
 * l'assiduite de guerre (`domain/war/war-history`, `domain/war/current-war`).
 */

import type { CurrentWarParticipant } from '../war/current-war';
import type { PlayerAttendance } from '../war/war-history';
import type { ClanMember } from './members';

/** Nombre de semaines completes exigees pour le filtre "meritants". */
const MERIT_REQUIRED_WEEKS = 3;
/** Combats attendus par semaine (US 4.2) : le maximum, jamais moins pour un meritant. */
const MERIT_REQUIRED_BATTLES = 16;

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

export interface WatchCandidate {
  member: ClanMember;
  /** Decks joues sur la semaine de guerre en cours, borne [0, 16]. */
  currentWeekBattles: number;
}

/**
 * Membres `elder` sous `minWeeklyBattles` combats sur la semaine de
 * guerre en cours (regle produit du 2026-08-02 : remplace l'ancien
 * critere elargi a `elder`/`coLeader` et a la derniere semaine complete
 * en plus de la semaine en cours). Un membre absent de
 * `currentWeekParticipants` (pas de guerre active) n'est pas evalue
 * plutot que disqualifie par defaut.
 */
export function findWatchlistMembers(
  members: readonly ClanMember[],
  currentWeekParticipants: readonly Pick<CurrentWarParticipant, 'tag' | 'decksUsed'>[],
  minWeeklyBattles: number,
): WatchCandidate[] {
  const currentWeekByTag = new Map(
    currentWeekParticipants.map((entry) => [entry.tag, entry.decksUsed]),
  );

  const candidates: WatchCandidate[] = [];
  for (const member of members) {
    if (member.role !== 'elder') {
      continue;
    }
    const currentWeekBattles = currentWeekByTag.get(member.tag);
    if (currentWeekBattles === undefined || currentWeekBattles >= minWeeklyBattles) {
      continue;
    }
    candidates.push({ member, currentWeekBattles });
  }

  return candidates.sort((a, b) => compareByNameThenTag(a.member, b.member));
}
