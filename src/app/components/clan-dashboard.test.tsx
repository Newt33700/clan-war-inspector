/**
 * Tests d'integration du dashboard membres (US 3.1 / US 3.2).
 * Le reseau est entierement mocke par MSW : le composant appelle le proxy
 * /api/clans/{tag} comme en production.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setMockResponse } from '@/mocks/handlers';
import {
  FIXTURE_EMPTY_CLAN,
  FIXTURE_FULL_CLAN,
  FIXTURE_PLAYER_PROFILE,
  FIXTURE_RIVER_RACE_IDLE,
  FIXTURE_RIVER_RACE_IN_PROGRESS,
  FIXTURE_RIVER_RACE_LOG,
} from '@/mocks/fixtures';
import { mockServer } from '@/mocks/server';
import { ClanDashboard } from './clan-dashboard';

async function submitTag(tag: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/tag ou nom du clan/i), tag);
  await user.click(screen.getByRole('button', { name: /inspecter/i }));
  return user;
}

describe('ClanDashboard', () => {
  // La soumission (US 6.2) ecrit le tag dans l'URL : on repart d'une URL
  // propre a chaque test pour ne pas contaminer le mount suivant.
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
  });

  it('invite a saisir un tag au premier affichage', () => {
    render(<ClanDashboard />);
    expect(screen.getByText(/saisissez le tag de votre clan/i)).toBeInTheDocument();
  });

  it('desactive le bouton immediatement quand le tag est invalide', async () => {
    render(<ClanDashboard />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#2PZ');

    expect(screen.getByRole('button', { name: /inspecter/i })).toBeDisabled();
  });

  it('n affiche le message de format invalide qu apres une pause de frappe (US 6.5)', async () => {
    render(<ClanDashboard />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tag ou nom du clan/i), '#2PZ');

    // Pas encore affiche juste apres la frappe.
    expect(screen.queryByText(/tag invalide/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/tag invalide/i)).toBeInTheDocument();
    });
  });

  it('affiche un exemple de tag realiste et une aide pour le retrouver', () => {
    render(<ClanDashboard />);

    expect(screen.getByLabelText(/tag ou nom du clan/i)).toHaveAttribute(
      'placeholder',
      '#20J20QG ou Chevreaux Team',
    );
    expect(screen.getByText(/visible dans clash royale/i)).toBeInTheDocument();
  });

  it('charge puis affiche les membres du clan via le proxy mocke', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    const rows = await screen.findAllByTestId('member-row');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('Joueur 1')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Chef')).toBeInTheDocument();
  });

  it('affiche l en-tete d identite du clan une fois charge (US 6.1)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');
    await screen.findAllByTestId('member-row');

    const header = screen.getByTestId('clan-header');
    expect(within(header).getByText('Test Clan')).toBeInTheDocument();
    expect(within(header).getByText(/3\/50 membres/)).toBeInTheDocument();
    expect(document.title).toBe('Test Clan | Clan War Inspector');
  });

  it('n affiche pas l en-tete de clan avant chargement reussi', () => {
    render(<ClanDashboard />);
    expect(screen.queryByTestId('clan-header')).not.toBeInTheDocument();
  });

  it('met a jour l URL au clic sur Inspecter, sans recharger la page (US 6.2)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    expect(window.location.search).toBe('?clan=%2320PP');
  });

  it('charge automatiquement le tag present dans l URL au demarrage (US 6.2)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    window.history.replaceState(null, '', '/?clan=%2320PP');

    render(<ClanDashboard />);

    const rows = await screen.findAllByTestId('member-row');
    expect(rows).toHaveLength(3);
    expect(screen.getByLabelText(/tag ou nom du clan/i)).toHaveValue('#20PP');
  });

  it('priorise le tag de l URL sur celui memorise en localStorage (US 6.2)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    window.localStorage.setItem('clan-war-inspector:last-clan-tag', '#RRRR');
    window.history.replaceState(null, '', '/?clan=%2320PP');

    render(<ClanDashboard />);

    await screen.findAllByTestId('member-row');
    expect(screen.getByLabelText(/tag ou nom du clan/i)).toHaveValue('#20PP');
  });

  it('trie par role descendant par defaut (chef en premier)', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    const rows = await screen.findAllByTestId('member-row');
    const roles = rows.map((row) => within(row).getAllByRole('cell')[1]?.textContent);
    expect(roles).toEqual(['Chef', 'Aine', 'Membre']);
  });

  it('change de colonne de tri au clic et affiche l indicateur', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);
    const user = await submitTag('#20PP');
    await screen.findAllByTestId('member-row');

    await user.click(screen.getByRole('button', { name: /trophees/i }));

    const rows = screen.getAllByTestId('member-row');
    const trophies = rows.map((row) => within(row).getAllByRole('cell')[3]?.textContent);
    expect(trophies).toEqual(['5000', '6500', '7000']);
    expect(screen.getByRole('columnheader', { name: /trophees/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('inverse la direction en recliquant la meme colonne', async () => {
    setMockResponse('clan', FIXTURE_FULL_CLAN);
    render(<ClanDashboard />);
    const user = await submitTag('#20PP');
    await screen.findAllByTestId('member-row');

    await user.click(screen.getByRole('button', { name: /trophees/i }));
    await user.click(screen.getByRole('button', { name: /trophees/i }));

    const rows = screen.getAllByTestId('member-row');
    const trophies = rows.map((row) => within(row).getAllByRole('cell')[3]?.textContent);
    expect(trophies).toEqual(['7000', '6500', '5000']);
    expect(screen.getByRole('columnheader', { name: /trophees/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('affiche l etat clan vide', async () => {
    setMockResponse('clan', FIXTURE_EMPTY_CLAN);
    render(<ClanDashboard />);

    await submitTag('#20PP');

    expect(
      await screen.findByText(/ce clan ne compte aucun membre/i),
    ).toBeInTheDocument();
  });

  it('affiche le message d erreur stable du proxy', async () => {
    mockServer.use(
      http.get('*/api/clans/:clanTag', () =>
        HttpResponse.json(
          {
            error: {
              code: 'CLAN_NOT_FOUND',
              message: 'Aucun clan ne correspond a ce tag.',
            },
          },
          { status: 404 },
        ),
      ),
    );
    render(<ClanDashboard />);

    await submitTag('#20PP');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Aucun clan ne correspond a ce tag.');
  });

  it('passe par un etat de chargement visible', async () => {
    // Reponse controlee manuellement plutot qu'un delai fixe : evite une
    // course avec l'horloge reelle si l'environnement de test est lent.
    let resolveClanResponse!: (response: Response) => void;
    mockServer.use(
      http.get(
        '*/api/clans/:clanTag',
        () => new Promise<Response>((resolve) => (resolveClanResponse = resolve)),
      ),
    );
    render(<ClanDashboard />);

    await submitTag('#20PP');

    expect(screen.getByRole('status')).toHaveTextContent(/chargement/i);

    resolveClanResponse(HttpResponse.json(FIXTURE_FULL_CLAN));
    await waitFor(() => {
      expect(screen.getAllByTestId('member-row')).toHaveLength(3);
    });
  });

  describe('US 6.7 : tri et indice de scroll sur l historique', () => {
    async function loadHistoryReady() {
      const heading = await screen.findByRole('heading', {
        name: /historique des guerres/i,
      });
      return heading.closest('section')!;
    }

    it('trie l historique par Total croissant au clic', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('riverRaceLog', FIXTURE_RIVER_RACE_LOG);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      const historySection = await loadHistoryReady();
      await within(historySection).findAllByTestId('history-row');

      await user.click(within(historySection).getByRole('button', { name: /^total/i }));

      const rows = within(historySection).getAllByTestId('history-row');
      expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
        'Joueur 3#PLAYER3',
        'Joueur 2#PLAYER2',
        'Joueur 1#PLAYER1',
      ]);
      expect(
        within(historySection).getByRole('columnheader', { name: /^total/i }),
      ).toHaveAttribute('aria-sort', 'ascending');
    });

    it('n affiche pas d indice de scroll avec peu de semaines', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('riverRaceLog', FIXTURE_RIVER_RACE_LOG);
      render(<ClanDashboard />);
      await submitTag('#20PP');
      const historySection = await loadHistoryReady();
      await within(historySection).findAllByTestId('history-row');

      expect(
        within(historySection).queryByText(/faites glisser/i),
      ).not.toBeInTheDocument();
    });

    it('affiche un indice de scroll au-dela de 4 semaines', async () => {
      const manyWeeksLog = {
        items: FIXTURE_RIVER_RACE_LOG.items.concat(
          FIXTURE_RIVER_RACE_LOG.items.map((item) => ({
            ...item,
            sectionIndex: item.sectionIndex + 10,
          })),
          FIXTURE_RIVER_RACE_LOG.items.map((item) => ({
            ...item,
            sectionIndex: item.sectionIndex + 20,
          })),
        ),
      };
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('riverRaceLog', manyWeeksLog);
      render(<ClanDashboard />);
      await submitTag('#20PP');
      const historySection = await loadHistoryReady();
      await within(historySection).findAllByTestId('history-row');

      expect(within(historySection).getByText(/faites glisser/i)).toBeInTheDocument();
    });
  });

  describe('US 6.4 : horodatage et rafraichissement de la guerre en cours', () => {
    it('affiche l heure de derniere mise a jour et permet un rafraichissement cible', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IDLE);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      await screen.findAllByTestId('member-row');

      const warSection = screen
        .getByRole('heading', { name: /guerre en cours/i })
        .closest('section')!;
      await waitFor(() => {
        expect(
          within(warSection).getByText(/mise a jour a \d{2}:\d{2}/i),
        ).toBeInTheDocument();
      });

      // Le tri des membres et le tag saisi ne doivent pas etre affectes.
      await user.click(screen.getByRole('button', { name: /trophees/i }));
      const beforeRows = screen
        .getAllByTestId('member-row')
        .map((row) => within(row).getAllByRole('cell')[0]?.textContent);

      await user.click(within(warSection).getByRole('button', { name: /actualiser/i }));

      await waitFor(() => {
        expect(
          within(warSection).getByText(/mise a jour a \d{2}:\d{2}/i),
        ).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/tag ou nom du clan/i)).toHaveValue('#20PP');
      const afterRows = screen
        .getAllByTestId('member-row')
        .map((row) => within(row).getAllByRole('cell')[0]?.textContent);
      expect(afterRows).toEqual(beforeRows);
    });
  });

  describe('regle produit du 2026-08-02 : A expulser (role Membre, semaine en cours)', () => {
    async function loadPurgeReady() {
      const heading = await screen.findByRole('heading', { name: /^a expulser$/i });
      return heading.closest('section')!;
    }

    it('liste un membre (pas un elder/leader) sous le seuil de combats cette semaine', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IN_PROGRESS);
      render(<ClanDashboard />);
      await submitTag('#20PP');
      const purgeSection = await loadPurgeReady();

      // Joueur 3 (role member, 5/16 combats) est sous le seuil par defaut (8).
      // Joueur 1 (leader, 4/16) et Joueur 2 (elder, 14/16) ne sont jamais
      // candidats a l'expulsion, quel que soit leur nombre de combats.
      expect(await within(purgeSection).findByText('Joueur 3')).toBeInTheDocument();
      expect(within(purgeSection).queryByText('Joueur 1')).not.toBeInTheDocument();
      expect(within(purgeSection).queryByText('Joueur 2')).not.toBeInTheDocument();
    });

    it('recalcule la liste quand le seuil change', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IN_PROGRESS);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      const purgeSection = await loadPurgeReady();
      await within(purgeSection).findByText('Joueur 3');

      await user.clear(
        within(purgeSection).getByLabelText(/seuil de combats sur la semaine en cours/i),
      );
      await user.type(
        within(purgeSection).getByLabelText(/seuil de combats sur la semaine en cours/i),
        '2',
      );

      // Sous le seuil 2, Joueur 3 (5 combats) n est plus candidat.
      expect(
        await within(purgeSection).findByText(/aucun membre problematique/i),
      ).toBeInTheDocument();
    });

    it('copie la liste des candidats et affiche une confirmation', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IN_PROGRESS);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      const purgeSection = await loadPurgeReady();
      await within(purgeSection).findByText('Joueur 3');

      // Definie apres userEvent.setup() (dans submitTag) : celui-ci installe
      // son propre stub de presse-papiers qui ecraserait un mock pose avant.
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      await user.click(
        within(purgeSection).getByRole('button', { name: /copier la liste/i }),
      );

      expect(writeText).toHaveBeenCalledWith(
        "⚠️ Mise au point du Clan : Les joueurs suivants n'ont pas respecté le " +
          'quota de combats cette semaine sur 8 : Joueur 3. Merci de corriger le tir rapidement !',
      );
      expect(await within(purgeSection).findByText(/copié/i)).toBeInTheDocument();
    });
  });

  describe('US 9 : panneau d inspection joueur', () => {
    it('ouvre le panneau avec le profil au clic sur une ligne, et le ferme', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      setMockResponse('playerProfile', FIXTURE_PLAYER_PROFILE);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      const rows = await screen.findAllByTestId('member-row');
      await user.click(within(rows[0]!).getByRole('button', { name: /joueur 1/i }));

      const drawer = screen
        .getByRole('heading', { name: /profil joueur/i })
        .closest('aside')!;
      await within(drawer).findByText('500');

      await user.click(within(drawer).getByRole('button', { name: /fermer/i }));

      expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('US 10.1 : recherche de clan par tag ou par nom', () => {
    async function typeQuery(query: string) {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/tag ou nom du clan/i), query);
      return user;
    }

    it('charge directement le dashboard quand la recherche par nom ne retourne qu un candidat', async () => {
      setMockResponse('clanSearch', {
        items: [{ tag: '#20PP', name: 'Chevreaux Team', members: 3 }],
      });
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);

      await typeQuery('Chevreaux Team');

      const rows = await screen.findAllByTestId('member-row');
      expect(rows).toHaveLength(3);
      expect(screen.getByTestId('clan-header')).toBeInTheDocument();
    });

    it('affiche une liste de candidats cliquable quand plusieurs clans correspondent', async () => {
      setMockResponse('clanSearch', {
        items: [
          { tag: '#2PYU', name: 'Chevreaux Team', members: 10 },
          { tag: '#2GVR', name: 'Chevreaux Legends', members: 20 },
        ],
      });
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);

      await typeQuery('Chevreaux');

      const candidates = await screen.findAllByTestId('clan-search-candidate');
      expect(candidates).toHaveLength(2);
      expect(candidates[0]).toHaveTextContent('Chevreaux Team');
      expect(candidates[0]).toHaveTextContent('#2PYU');
      expect(candidates[1]).toHaveTextContent('Chevreaux Legends');

      const user = userEvent.setup();
      await user.click(candidates[0]!);

      const rows = await screen.findAllByTestId('member-row');
      expect(rows).toHaveLength(3);
    });

    it('affiche un message distinct quand aucun clan ne correspond au nom', async () => {
      setMockResponse('clanSearch', { items: [] });
      render(<ClanDashboard />);

      await typeQuery('Introuvable');

      expect(
        await screen.findByText(/aucun clan ne correspond a « introuvable »/i),
      ).toBeInTheDocument();
    });

    it('affiche une aide plutot qu un appel reseau pour une requete trop courte', async () => {
      const upstreamCalls: string[] = [];
      mockServer.use(
        http.get('*/api/clans', ({ request }) => {
          upstreamCalls.push(request.url);
          return HttpResponse.json({ items: [] });
        }),
      );
      render(<ClanDashboard />);

      await typeQuery('ab');

      expect(
        await screen.findByText(/continuez a taper \(3 caracteres minimum\)/i),
      ).toBeInTheDocument();
      // Laisse le debounce (400ms) largement le temps de se declencher.
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(upstreamCalls).toHaveLength(0);
    });

    it('affiche un etat de chargement pendant la recherche par nom', async () => {
      let resolveSearch!: (response: Response) => void;
      mockServer.use(
        http.get(
          '*/api/clans',
          () => new Promise<Response>((resolve) => (resolveSearch = resolve)),
        ),
      );
      render(<ClanDashboard />);

      await typeQuery('Chevreaux');

      expect(await screen.findByRole('status')).toHaveTextContent(/recherche de clans/i);

      resolveSearch(HttpResponse.json({ items: [] }));
      expect(
        await screen.findByText(/aucun clan ne correspond a « chevreaux »/i),
      ).toBeInTheDocument();
    });

    it('affiche une erreur de recherche et permet de reessayer', async () => {
      setMockResponse('clanSearch', { error: 'boom' });
      render(<ClanDashboard />);

      await typeQuery('Chevreaux');

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();

      setMockResponse('clanSearch', { items: [] });
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /reessayer/i }));

      expect(
        await screen.findByText(/aucun clan ne correspond a « chevreaux »/i),
      ).toBeInTheDocument();
    });

    it('affiche le badge du candidat quand il est fourni', async () => {
      setMockResponse('clanSearch', {
        items: [
          { tag: '#2PYU', name: 'Chevreaux Team', members: 10, badgeUrls: {} },
          {
            tag: '#2GVR',
            name: 'Chevreaux Legends',
            members: 20,
            badgeUrls: { medium: 'https://example.com/badge.png' },
          },
        ],
      });
      render(<ClanDashboard />);

      await typeQuery('Chevreaux');

      const candidates = await screen.findAllByTestId('clan-search-candidate');
      expect(candidates[0]!.querySelector('img')).not.toBeInTheDocument();
      expect(candidates[1]!.querySelector('img')).toHaveAttribute(
        'src',
        'https://example.com/badge.png',
      );
    });

    it('continue de traiter un tag explicite (#...) comme un tag, pas une recherche', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);

      await submitTag('#20PP');

      const rows = await screen.findAllByTestId('member-row');
      expect(rows).toHaveLength(3);
      expect(screen.queryByTestId('clan-search-candidate')).not.toBeInTheDocument();
    });
  });

  describe('US-8 (audit UX 2026-08-02) : recherche de membre', () => {
    it('filtre les membres par pseudo en temps reel', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      await screen.findAllByTestId('member-row');

      await user.type(screen.getByLabelText(/rechercher un membre/i), 'joueur 2');

      const rows = screen.getAllByTestId('member-row');
      expect(rows).toHaveLength(1);
      expect(within(rows[0]!).getByText('Joueur 2')).toBeInTheDocument();
    });

    it('affiche un message distinct quand aucun membre ne correspond', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');
      await screen.findAllByTestId('member-row');

      await user.type(screen.getByLabelText(/rechercher un membre/i), 'zzzzz');

      expect(await screen.findByText(/aucun membre ne correspond/i)).toBeInTheDocument();
      expect(screen.queryByTestId('member-row')).not.toBeInTheDocument();
    });
  });

  describe('US 6.3 : reprise apres erreur, section par section', () => {
    it('reessaie uniquement le clan sans re-soumettre le formulaire', async () => {
      // Pas de mock configure : le handler global repond 404.
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      const alertsBefore = await screen.findAllByRole('alert');
      expect(alertsBefore).toHaveLength(1);

      setMockResponse('clan', FIXTURE_FULL_CLAN);
      await user.click(screen.getByRole('button', { name: /reessayer/i }));

      const rows = await screen.findAllByTestId('member-row');
      expect(rows).toHaveLength(3);
    });

    it('reessaie la guerre en cours sans recharger membres ni historique', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      // currentRiverRace et riverRaceLog restent non configures (404).
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      await screen.findAllByTestId('member-row');
      const warSection = screen
        .getByRole('heading', { name: /guerre en cours/i })
        .closest('section')!;
      await waitFor(() => {
        expect(within(warSection).getByRole('alert')).toBeInTheDocument();
      });

      setMockResponse('currentRiverRace', FIXTURE_RIVER_RACE_IDLE);
      await user.click(within(warSection).getByRole('button', { name: /reessayer/i }));

      await waitFor(() => {
        expect(
          within(warSection).getByText(/n est pas en guerre actuellement/i),
        ).toBeInTheDocument();
      });
      // L'historique, toujours en erreur, n'a pas ete affecte par ce reessai.
      const historySection = screen
        .getByRole('heading', { name: /historique des guerres/i })
        .closest('section')!;
      expect(within(historySection).getByRole('alert')).toBeInTheDocument();
    });

    it('reessaie l historique sans recharger la guerre en cours', async () => {
      setMockResponse('clan', FIXTURE_FULL_CLAN);
      render(<ClanDashboard />);
      const user = await submitTag('#20PP');

      await screen.findAllByTestId('member-row');
      const historySection = screen
        .getByRole('heading', { name: /historique des guerres/i })
        .closest('section')!;
      await waitFor(() => {
        expect(within(historySection).getByRole('alert')).toBeInTheDocument();
      });

      setMockResponse('riverRaceLog', FIXTURE_RIVER_RACE_LOG);
      await user.click(
        within(historySection).getByRole('button', { name: /reessayer/i }),
      );

      await waitFor(() => {
        expect(
          within(historySection).getAllByTestId('history-row').length,
        ).toBeGreaterThan(0);
      });
    });
  });
});
