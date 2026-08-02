/**
 * Tests pour les handlers MSW.
 * Verifie que les mocks interceptent correctement les appels reseau.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setMockResponse, resetMockResponses, getMockResponse } from './handlers';
import {
  FIXTURE_FULL_CLAN,
  FIXTURE_EMPTY_CLAN,
  FIXTURE_RIVER_RACE_LOG,
  FIXTURE_RIVER_RACE_IN_PROGRESS,
  FIXTURE_RIVER_RACE_IDLE,
} from './fixtures';

describe('MSW handlers', () => {
  beforeEach(() => {
    resetMockResponses();
  });

  describe('Mock response management', () => {
    it('initialise toutes les reponses a null', () => {
      expect(getMockResponse('clan')).toBeNull();
      expect(getMockResponse('currentRiverRace')).toBeNull();
      expect(getMockResponse('riverRaceLog')).toBeNull();
    });

    it('definit et recupere une reponse mockee', () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      expect(getMockResponse('clan')).toBe(FIXTURE_FULL_CLAN);
    });

    it('reinitialise les reponses mockees', () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      resetMockResponses();
      expect(getMockResponse('clan')).toBeNull();
    });
  });

  describe('Fixtures data integrity', () => {
    it('FIXTURE_FULL_CLAN contient les donnees completes', () => {
      expect(FIXTURE_FULL_CLAN).toHaveProperty('tag', '#20PP');
      expect(FIXTURE_FULL_CLAN.memberList.length).toBe(3);
      expect(FIXTURE_FULL_CLAN.memberList[0]?.role).toBe('leader');
    });

    it('FIXTURE_EMPTY_CLAN est vide', () => {
      expect(FIXTURE_EMPTY_CLAN.members).toBe(0);
      expect(FIXTURE_EMPTY_CLAN.memberList.length).toBe(0);
    });

    it('FIXTURE_RIVER_RACE_LOG contient lhistorique au format API reel', () => {
      expect(FIXTURE_RIVER_RACE_LOG.items.length).toBe(2);
      const week = FIXTURE_RIVER_RACE_LOG.items[0];
      expect(week?.standings[0]?.clan.participants.length).toBe(4);
      expect(week?.standings[0]?.clan.participants[0]?.decksUsed).toBe(16);
    });

    it('FIXTURE_RIVER_RACE_IN_PROGRESS represente une guerre en cours', () => {
      expect(FIXTURE_RIVER_RACE_IN_PROGRESS.state).toBe('war');
      // 4 participants : 3 membres actuels + #PLAYER9, parti depuis (cf. commentaire ligne 192).
      expect(FIXTURE_RIVER_RACE_IN_PROGRESS.clan.participants.length).toBe(4);
    });

    it('FIXTURE_RIVER_RACE_IDLE represente un etat inactif', () => {
      expect(FIXTURE_RIVER_RACE_IDLE.state).toBe('notInWar');
      expect(FIXTURE_RIVER_RACE_IDLE.clan.participants.length).toBe(0);
    });
  });

  describe('Mock response types', () => {
    it('accepte une reponse derreur (objet avec error)', () => {
      const errorResponse = { error: 'Internal Server Error' };
      setMockResponse('clan', errorResponse);
      expect(getMockResponse('clan')).toEqual(errorResponse);
    });

    it('accepte null pour simuler une ressource non trouvee', () => {
      setMockResponse('clan', null);
      expect(getMockResponse('clan')).toBeNull();
    });
  });
});
