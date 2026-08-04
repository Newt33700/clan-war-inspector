import { describe, expect, it } from 'vitest';
import { parseRecentBattles } from './battle-log';

function battle(teamCrowns: number, opponentCrowns: number) {
  return {
    team: [{ crowns: teamCrowns }],
    opponent: [{ crowns: opponentCrowns }],
  };
}

describe('parseRecentBattles', () => {
  it('retourne un tableau vide pour une reponse inexploitable', () => {
    expect(parseRecentBattles(null)).toEqual([]);
    expect(parseRecentBattles(undefined)).toEqual([]);
    expect(parseRecentBattles({})).toEqual([]);
    expect(parseRecentBattles('oops')).toEqual([]);
  });

  it('retourne un tableau vide pour un historique vide', () => {
    expect(parseRecentBattles([])).toEqual([]);
  });

  it('classe victoire, defaite et match nul selon les couronnes', () => {
    const raw = [battle(3, 1), battle(0, 2), battle(1, 1)];
    expect(parseRecentBattles(raw)).toEqual([
      { result: 'win' },
      { result: 'loss' },
      { result: 'draw' },
    ]);
  });

  it('ignore une entree sans team ni opponent exploitables sans planter', () => {
    const raw = [battle(2, 0), 'oops', null, { team: [], opponent: [] }, { team: 'x' }];
    expect(parseRecentBattles(raw)).toEqual([{ result: 'win' }, { result: 'draw' }]);
  });

  it('traite un participant non exploitable comme 0 couronne', () => {
    const raw = [{ team: [42], opponent: [{ crowns: 1 }] }];
    expect(parseRecentBattles(raw)).toEqual([{ result: 'loss' }]);
  });

  it('limite aux 20 combats les plus recents', () => {
    const raw = Array.from({ length: 25 }, () => battle(1, 0));
    expect(parseRecentBattles(raw)).toHaveLength(20);
  });
});
