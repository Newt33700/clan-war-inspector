/**
 * Vue de renvoi (US 5.1) : compile dons et assiduite de guerre pour ne
 * garder que les joueurs problematiques.
 *
 * Regle par defaut du backlog : 0 don ET moins de X combats de guerre.
 * La regle de combinaison est explicite (`AND` / `OR`) et les bornes
 * sont strictes : donations === 0, combats totaux < seuil.
 * Un membre sans aucune donnee de guerre est traite comme 0 combat.
 */

import type { PlayerAttendance } from '../war/war-history';
import type { ClanMember } from './members';

export type PurgeReason = 'ZERO_DONATIONS' | 'LOW_WAR_ACTIVITY';

export type PurgeCombinator = 'AND' | 'OR';

export interface PurgeCriteria {
  /** Seuil strict de combats : signale si total < minWarBattles. */
  minWarBattles: number;
  /** Regle de combinaison des criteres, `AND` par defaut. */
  combinator?: PurgeCombinator;
}

export interface PurgeCandidate {
  member: ClanMember;
  /** Motifs d'inclusion, toujours affiches a l'utilisateur. */
  reasons: PurgeReason[];
  /** Total de combats connus, `null` si absent de tout l'historique. */
  totalWarBattles: number | null;
}

/** Libelles francais des motifs pour l'affichage. */
export const PURGE_REASON_LABELS: Record<PurgeReason, string> = {
  ZERO_DONATIONS: 'Aucun don',
  LOW_WAR_ACTIVITY: 'Combats de guerre insuffisants',
};

/**
 * Filtre les membres problematiques selon les criteres.
 *
 * Le resultat est ordonne du plus problematique au moins problematique :
 * combats croissants puis dons croissants, tie-break nom puis tag.
 */
export function findPurgeCandidates(
  members: readonly ClanMember[],
  attendance: readonly PlayerAttendance[],
  criteria: PurgeCriteria,
): PurgeCandidate[] {
  const combinator: PurgeCombinator = criteria.combinator ?? 'AND';
  const battlesByTag = new Map(
    attendance.map((player) => [player.tag, player.totalBattles]),
  );

  const candidates: PurgeCandidate[] = [];
  for (const member of members) {
    const totalWarBattles = battlesByTag.get(member.tag) ?? null;
    const battlesForRule = totalWarBattles ?? 0;

    const reasons: PurgeReason[] = [];
    if (member.donations === 0) {
      reasons.push('ZERO_DONATIONS');
    }
    if (battlesForRule < criteria.minWarBattles) {
      reasons.push('LOW_WAR_ACTIVITY');
    }

    const isCandidate = combinator === 'AND' ? reasons.length === 2 : reasons.length >= 1;
    if (isCandidate) {
      candidates.push({ member, reasons, totalWarBattles });
    }
  }

  candidates.sort((a, b) => {
    const battlesA = a.totalWarBattles ?? 0;
    const battlesB = b.totalWarBattles ?? 0;
    if (battlesA !== battlesB) {
      return battlesA - battlesB;
    }
    if (a.member.donations !== b.member.donations) {
      return a.member.donations - b.member.donations;
    }
    return (
      a.member.name.localeCompare(b.member.name) ||
      a.member.tag.localeCompare(b.member.tag)
    );
  });
  return candidates;
}
