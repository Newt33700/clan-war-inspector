/**
 * Tests du suivi en direct de la guerre en cours (US 4.1).
 * Module pur et defensif comme le moteur d'historique (US 4.2) : chaque
 * repli et chaque cas limite verrouilles par un cas de test explicite.
 */

import { describe, expect, it } from 'vitest';
import {
  annotateWithMembership,
  DECKS_PER_DAY,
  parseCurrentWar,
  sortByUrgency,
  type AnnotatedWarParticipant,
} from './current-war';
import { BATTLES_PER_WAR_WEEK } from './war-history';

describe('DECKS_PER_DAY', () => {
  it('vaut 4', () => {
    expect(DECKS_PER_DAY).toBe(4);
  });
});

describe('parseCurrentWar', () => {
  it.each([
    ['null', null],
    ['nombre', 42],
    ['chaine', 'garbage'],
    ['tableau', []],
  ])('retourne un etat par defaut pour une reponse inexploitable (%s)', (_l, raw) => {
    expect(parseCurrentWar(raw)).toEqual({
      state: null,
      periodType: 'unknown',
      isTrainingDay: false,
      participants: [],
    });
  });

  it('extrait le state quand il est une chaine', () => {
    expect(parseCurrentWar({ state: 'war' }).state).toBe('war');
  });

  it('retombe sur null quand state est absent ou non string', () => {
    expect(parseCurrentWar({}).state).toBeNull();
    expect(parseCurrentWar({ state: 42 }).state).toBeNull();
  });

  it.each(['training', 'warDay', 'colosseum'] as const)(
    'conserve le periodType connu %s',
    (periodType) => {
      expect(parseCurrentWar({ periodType }).periodType).toBe(periodType);
    },
  );

  it('retombe sur unknown pour un periodType inconnu ou absent', () => {
    expect(parseCurrentWar({ periodType: 'oops' }).periodType).toBe('unknown');
    expect(parseCurrentWar({}).periodType).toBe('unknown');
  });

  it('isTrainingDay est vrai seulement pour periodType training', () => {
    expect(parseCurrentWar({ periodType: 'training' }).isTrainingDay).toBe(true);
    expect(parseCurrentWar({ periodType: 'warDay' }).isTrainingDay).toBe(false);
    expect(parseCurrentWar({ periodType: 'colosseum' }).isTrainingDay).toBe(false);
  });

  it('delegue le parsing des participants a raw.clan', () => {
    const war = parseCurrentWar({
      clan: {
        participants: [
          { tag: '#P1', name: 'A', decksUsedToday: 2, decksUsed: 10, fame: 300 },
        ],
      },
    });
    expect(war.participants).toEqual([
      { tag: '#P1', name: 'A', decksUsedToday: 2, decksUsed: 10, fame: 300 },
    ]);
  });

  it.each([
    ['clan absent', {}],
    ['clan non objet', { clan: 'oops' }],
    ['participants non tableau', { clan: { participants: 'oops' } }],
  ])('retourne aucun participant si inexploitable (%s)', (_l, raw) => {
    expect(parseCurrentWar(raw).participants).toEqual([]);
  });

  it('ignore une entree participant non exploitable', () => {
    const war = parseCurrentWar({
      clan: { participants: ['oops', null, { name: 'sans tag' }] },
    });
    expect(war.participants).toEqual([]);
  });

  it('canonicalise le tag du participant', () => {
    const war = parseCurrentWar({ clan: { participants: [{ tag: ' p1uu ' }] } });
    expect(war.participants[0]?.tag).toBe('#P1UU');
  });

  it('remplace un nom manquant ou vide par le tag', () => {
    const war = parseCurrentWar({
      clan: { participants: [{ tag: '#P1' }, { tag: '#P2', name: '' }] },
    });
    expect(war.participants.map((p) => p.name)).toEqual(['#P1', '#P2']);
  });

  it('borne decksUsedToday et decksUsed a leurs plafonds respectifs', () => {
    const war = parseCurrentWar({
      clan: {
        participants: [
          { tag: '#P1', decksUsedToday: 99, decksUsed: 999 },
          { tag: '#P2', decksUsedToday: -5, decksUsed: -5 },
        ],
      },
    });
    expect(war.participants[0]).toMatchObject({
      decksUsedToday: DECKS_PER_DAY,
      decksUsed: BATTLES_PER_WAR_WEEK,
    });
    expect(war.participants[1]).toMatchObject({ decksUsedToday: 0, decksUsed: 0 });
  });

  it('coerce des decomptes serialises en chaine (audit UX 2026-08-02, US-4)', () => {
    const war = parseCurrentWar({
      clan: { participants: [{ tag: '#P1', decksUsedToday: '3', decksUsed: '12' }] },
    });
    expect(war.participants[0]).toMatchObject({ decksUsedToday: 3, decksUsed: 12 });
  });

  it('fusionne les doublons de tag en gardant le decompte le plus eleve', () => {
    const war = parseCurrentWar({
      clan: {
        participants: [
          { tag: '#P1', decksUsedToday: 1, decksUsed: 5, fame: 100 },
          { tag: ' p1 ', decksUsedToday: 3, decksUsed: 2, fame: 300 },
        ],
      },
    });
    expect(war.participants).toHaveLength(1);
    expect(war.participants[0]).toMatchObject({
      decksUsedToday: 3,
      decksUsed: 5,
      fame: 300,
    });
  });

  it('borne une fame manquante ou aberrante a 0 (Hall of Fame, US 8)', () => {
    const war = parseCurrentWar({
      clan: {
        participants: [
          { tag: '#P1', fame: 'oops' },
          { tag: '#P2', fame: -5 },
        ],
      },
    });
    expect(war.participants.every((p) => p.fame === 0)).toBe(true);
  });

  it('coerce une fame serialisee en chaine', () => {
    const war = parseCurrentWar({
      clan: { participants: [{ tag: '#P1', fame: '3200' }] },
    });
    expect(war.participants[0]?.fame).toBe(3200);
  });

  it('ne sous-evalue jamais la fame d un doublon deja meilleur (ordre inverse)', () => {
    const war = parseCurrentWar({
      clan: {
        participants: [
          { tag: '#P1', fame: 300 },
          { tag: ' p1 ', fame: 100 },
        ],
      },
    });
    expect(war.participants[0]?.fame).toBe(300);
  });
});

describe('annotateWithMembership', () => {
  const participants = [
    { tag: '#P1', name: 'A', decksUsedToday: 1, decksUsed: 1, fame: 0 },
    { tag: '#P2', name: 'B', decksUsedToday: 1, decksUsed: 1, fame: 0 },
  ];

  it('marque stillInClan vrai pour un tag present dans memberTags', () => {
    const annotated = annotateWithMembership(participants, ['#P1']);
    expect(annotated.find((p) => p.tag === '#P1')?.stillInClan).toBe(true);
  });

  it('marque stillInClan faux pour un tag absent (parti du clan)', () => {
    const annotated = annotateWithMembership(participants, ['#P1']);
    expect(annotated.find((p) => p.tag === '#P2')?.stillInClan).toBe(false);
  });

  it('canonicalise les memberTags avant comparaison', () => {
    const annotated = annotateWithMembership(participants, [' p1 ']);
    expect(annotated.find((p) => p.tag === '#P1')?.stillInClan).toBe(true);
  });

  it('ignore un memberTag non canonicalisable sans planter', () => {
    expect(() => annotateWithMembership(participants, ['!!'])).not.toThrow();
  });
});

describe('sortByUrgency', () => {
  function participant(
    overrides: Partial<AnnotatedWarParticipant>,
  ): AnnotatedWarParticipant {
    return {
      tag: '#TAG',
      name: 'Nom',
      decksUsedToday: 0,
      decksUsed: 0,
      fame: 0,
      stillInClan: true,
      ...overrides,
    };
  }

  it('place les 0 deck aujourd hui en premier', () => {
    const idle = participant({ tag: '#A', name: 'Alice', decksUsedToday: 0 });
    const active = participant({ tag: '#B', name: 'Bob', decksUsedToday: 2 });
    expect(sortByUrgency([active, idle]).map((p) => p.tag)).toEqual(['#A', '#B']);
  });

  it('departage par decks du jour croissants', () => {
    const two = participant({ tag: '#A', name: 'Alice', decksUsedToday: 2 });
    const one = participant({ tag: '#B', name: 'Bob', decksUsedToday: 1 });
    expect(sortByUrgency([two, one]).map((p) => p.tag)).toEqual(['#B', '#A']);
  });

  it('departage a decks du jour egaux par le cumul hebdomadaire croissant', () => {
    const high = participant({
      tag: '#A',
      name: 'Alice',
      decksUsedToday: 2,
      decksUsed: 10,
    });
    const low = participant({
      tag: '#B',
      name: 'Bob',
      decksUsedToday: 2,
      decksUsed: 3,
    });
    expect(sortByUrgency([high, low]).map((p) => p.tag)).toEqual(['#B', '#A']);
  });

  it('departage les ex-aequo totaux par nom puis tag', () => {
    const zoe = participant({ tag: '#Z', name: 'Zoe' });
    const anna = participant({ tag: '#Y', name: 'Anna' });
    expect(sortByUrgency([zoe, anna]).map((p) => p.name)).toEqual(['Anna', 'Zoe']);
  });

  it('departage les homonymes par tag', () => {
    const twinB = participant({ tag: '#ZZ', name: 'Jumeau' });
    const twinA = participant({ tag: '#AA', name: 'Jumeau' });
    expect(sortByUrgency([twinB, twinA]).map((p) => p.tag)).toEqual(['#AA', '#ZZ']);
  });

  it('ne mute pas le tableau d entree', () => {
    const input = [
      participant({ tag: '#B', name: 'Bob', decksUsedToday: 2 }),
      participant({ tag: '#A', name: 'Alice', decksUsedToday: 0 }),
    ];
    const copy = [...input];
    sortByUrgency(input);
    expect(input).toEqual(copy);
  });
});
