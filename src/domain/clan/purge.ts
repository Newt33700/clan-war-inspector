/**
 * Vue de renvoi "A expulser" (regle produit du 2026-08-02) : membres
 * (role `member` uniquement) dont l'activite de la semaine de guerre en
 * cours est insuffisante.
 *
 * Remplace l'ancienne regle (US 5.1 : 0 don ET/OU moins de X combats
 * cumules sur toutes les semaines connues de l'historique). Ce total
 * multi-semaines (jusqu'a 16 x N semaines) rendait le seuil quasi
 * inoperant des que le clan avait plus d'une semaine d'historique, et
 * melangeait deux signaux (dons, assiduite) difficiles a lire ensemble.
 * La regle est desormais un seul critere, sur la semaine en cours
 * uniquement - la meme semaine que celle affichee dans "Guerre en cours".
 */

import type { CurrentWarParticipant } from '../war/current-war';
import type { ClanMember } from './members';

export interface PurgeCandidate {
  member: ClanMember;
  /** Decks joues sur la semaine de guerre en cours, borne [0, 16]. */
  currentWeekBattles: number;
}

/**
 * Membres (role `member`) sous `minWeeklyBattles` combats sur la semaine
 * de guerre en cours.
 *
 * Un membre absent de `currentWeekParticipants` (pas de guerre active,
 * ou membre arrive apres le debut de la guerre) n'est pas evalue plutot
 * que disqualifie par defaut.
 *
 * Resultat trie du plus problematique au moins problematique (combats
 * croissants), tie-break nom puis tag.
 */
export function findPurgeCandidates(
  members: readonly ClanMember[],
  currentWeekParticipants: readonly Pick<CurrentWarParticipant, 'tag' | 'decksUsed'>[],
  minWeeklyBattles: number,
): PurgeCandidate[] {
  const currentWeekByTag = new Map(
    currentWeekParticipants.map((participant) => [
      participant.tag,
      participant.decksUsed,
    ]),
  );

  const candidates: PurgeCandidate[] = [];
  for (const member of members) {
    if (member.role !== 'member') {
      continue;
    }
    const currentWeekBattles = currentWeekByTag.get(member.tag);
    if (currentWeekBattles === undefined || currentWeekBattles >= minWeeklyBattles) {
      continue;
    }
    candidates.push({ member, currentWeekBattles });
  }

  candidates.sort((a, b) => {
    if (a.currentWeekBattles !== b.currentWeekBattles) {
      return a.currentWeekBattles - b.currentWeekBattles;
    }
    return (
      a.member.name.localeCompare(b.member.name) ||
      a.member.tag.localeCompare(b.member.tag)
    );
  });
  return candidates;
}
