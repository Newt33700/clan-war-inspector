/**
 * Dictionnaire francais : langue d'origine de l'app, source de verite du
 * type `Dictionary` (les 3 autres dictionnaires doivent respecter
 * exactement cette forme, verifie par `satisfies Dictionary`).
 */

const fr = {
  common: {
    retry: 'Réessayer',
  },
  nav: {
    ariaLabel: 'Navigation principale',
    brand: 'Clan War Inspector',
    dashboard: 'Dashboard',
    historique: 'Historique',
    rh: 'RH',
    nouveauxMembres: 'Nouveaux',
    meteo: 'Météo',
  },
  languageSwitcher: {
    label: 'Langue',
  },
  footer: {
    legalText:
      "Ce contenu n'est pas affilié, soutenu, sponsorisé ou spécifiquement approuvé par Supercell et Supercell n'en est pas responsable. Pour plus d'informations, veuillez consulter la politique relative aux contenus de fans de Supercell :",
    linkLabel: 'www.supercell.com/fan-content-policy',
    licenseLabel: 'Licence',
  },
  clanSearch: {
    ariaLabel: 'Recherche de clan',
    fieldLabel: 'Tag ou nom du clan',
    placeholder: '#20J20QG ou Chevreaux Team',
    submit: 'Inspecter',
    helpText:
      "Saisissez le tag de votre clan (visible dans Clash Royale, sous son nom, sur l'écran du clan) ou directement son nom.",
    formatError: 'Tag invalide : caractères autorisés 0289PYLQGRJCUV, longueur 3 à 14.',
    continueTyping:
      'Continuez à taper ({min} caractères minimum) pour rechercher par nom.',
    searching: 'Recherche de clans nommés « {query} »...',
    noResults: 'Aucun clan ne correspond à « {query} ».',
    memberCount: '{count}/50 membres',
    changeClan: 'Changer de clan',
    activeClanSummary: 'Clan actif : {name} ({tag})',
    recentClansLabel: 'Clans récents',
  },
  clanStatus: {
    loadingLabel: 'Chargement du clan',
  },
  clanHeader: {
    stats: '{count}/{max} membres · Score {score} · Trophées de guerre {trophies}',
  },
  errorPage: {
    title: 'Défaite !',
    heading: 'Une erreur inattendue a fait tomber la tour',
    description:
      "Rien de définitif : relancez la partie. Si l'erreur persiste, vérifiez la configuration du serveur (clé API Supercell).",
  },
  notFoundPage: {
    code: '404',
    heading: 'Cette page a déserté le champ de bataille',
    description:
      "Elle n'a pas joué ses 16 combats non plus. Retournez au tableau de bord pour inspecter votre clan.",
    backLink: 'Retour au dashboard',
  },
  pages: {
    dashboardTitle: 'Dashboard',
    dashboardIdle: 'Saisissez le tag ou le nom de votre clan pour afficher le dashboard.',
    historiqueTitle: 'Historique des guerres',
    historiqueIdle:
      'Saisissez le tag ou le nom de votre clan pour afficher son historique.',
    rhTitle: 'Assistant RH',
    rhIdle: "Saisissez le tag ou le nom de votre clan pour afficher l'assistant RH.",
    meteoTitle: 'La Météo du Clan',
    meteoIdle: 'Saisissez le tag ou le nom de votre clan pour afficher la météo du clan.',
    nouveauxMembresTitle: 'Sas de quarantaine',
    nouveauxMembresIdle:
      'Saisissez le tag ou le nom de votre clan pour afficher le sas de quarantaine.',
  },
  dashboard: {
    membersTitle: 'Membres du clan',
    searchMemberLabel: 'Rechercher un membre',
    searchMemberPlaceholder: 'Pseudo ou tag...',
    noMembers: 'Ce clan ne compte aucun membre.',
    noMemberMatch: 'Aucun membre ne correspond à « {query} ».',
  },
  membersTable: {
    caption: 'Membres du clan',
    sortBy: 'Trier par',
    columnName: 'Joueur',
    columnRole: 'Rôle',
    columnTrophies: 'Trophées',
    columnDonations: 'Dons',
    sortNameAsc: 'Joueur (A-Z)',
    sortNameDesc: 'Joueur (Z-A)',
    sortRoleDesc: 'Rôle (chef en premier)',
    sortTrophiesDesc: 'Trophées (décroissant)',
    sortDonationsDesc: 'Dons (décroissant)',
    viewProfile: 'Voir le profil complet →',
    tag: 'Tag',
    trophies: 'Trophées',
    donations: 'Dons',
  },
  currentWar: {
    title: 'Guerre en cours',
    leftClan: 'A quitté le clan',
    today: "Aujourd'hui",
    trainingDay: "Jour d'entraînement",
    battleDay: 'Jour de bataille',
    updatedAt: 'Mise à jour à {time}',
    refresh: 'Actualiser',
    loadingLabel: 'Chargement de la guerre en cours',
    showFormerMembers: 'Afficher les anciens membres ({count})',
    notInWar: "Le clan n'est pas en guerre actuellement.",
    noParticipants: "Aucun membre actuel n'a participé à cette guerre pour l'instant.",
    tableCaption: 'Decks joués aujourd’hui et sur la semaine par participant',
    colPlayer: 'Joueur',
    colToday: "Aujourd'hui",
    colWeek: 'Semaine',
    idleTodaySr: " - aucun deck joué aujourd'hui",
  },
  warHistory: {
    title: 'Historique des guerres',
    loadingLabel: "Chargement de l'historique",
    noHistory: 'Aucun historique de guerre disponible pour ce clan.',
    noCurrentPlayers: "Aucun membre actuel n'a d'historique de guerre sur cette période.",
    legendNotMember: 'Non membre cette semaine-là',
    total: 'total',
    average: 'moy.',
    averageAria: 'Moyenne sur {count} semaine(s) de présence',
    seeMoreWeeks: 'Voir toutes les semaines',
    seeLessWeeks: 'Voir moins de semaines',
    sortBy: 'Trier par',
    defaultOrder: 'Ordre par défaut',
    totalDesc: 'Total (décroissant)',
    totalAsc: 'Total (croissant)',
    averageDesc: 'Moyenne (décroissante)',
    averageAsc: 'Moyenne (croissante)',
    scrollHint: 'Faites glisser pour voir plus de semaines →',
    colPlayer: 'Joueur',
    colTotal: 'Total',
    colAverage: 'Moyenne',
    tableCaption: 'Combats joués sur {max} par joueur et par semaine',
  },
  hallOfFame: {
    title: 'Hall of Fame',
    loadingLabel: 'Chargement du Hall of Fame',
    emptyTitle: 'Pas encore de classement',
    emptyDescription: 'Revenez à la fin de la semaine de guerre pour voir le podium.',
    fame: 'fame',
  },
  participation: {
    title: 'Participation de la semaine',
    loadingLabel: 'Chargement de la participation',
    notInWar: "Le clan n'est pas en guerre actuellement.",
    battlesLabel: '{played}/{possible} combats',
    ariaLabel: '{percent}% des combats de la semaine joués, {played} sur {possible}',
  },
  hrAssistant: {
    title: 'Assistant Ressources Humaines',
    loadingLabel: "Chargement de l'assistant RH",
    meritorious: 'Méritants',
    onWatch: 'Sur la sellette',
    copyRecommendations: 'Copier les recommandations',
    noMeritoriousTitle: 'Aucun méritant pour l’instant',
    noMeritoriousDescription:
      '16/16 sur 3 semaines et au moins un don cette semaine, pour un membre.',
    promotionSuggested: 'Promotion suggérée : Aîné',
    noWatchTitle: 'Personne sur la sellette',
    noWatchTrainingDescription:
      "Jour d'entraînement : la semaine de guerre n'a pas encore commencé, rien à évaluer.",
    noWatchDescription:
      'Aucun aîné sous {threshold}/16 combats sur la semaine de guerre en cours.',
    demotionSuggested: 'Rétrogradation conseillée',
    battlesThisWeek: '{count}/16 combats cette semaine',
  },
  purge: {
    title: 'À expulser',
    activeRule:
      'Règle active : rôle Membre et moins de {threshold} combats sur la semaine de guerre en cours.',
    thresholdPrefix: 'Membres ayant joué moins de',
    thresholdSuffix:
      "combats sur la semaine de guerre en cours (16 attendus). Ce seuil est aussi utilisé par l'Assistant RH pour la rubrique « Sur la sellette ».",
    thresholdAriaLabel: 'Seuil de combats sur la semaine en cours',
    trainingDay:
      "Jour d'entraînement : la semaine de guerre n'a pas encore commencé, rien à évaluer.",
    notInWar:
      "Le clan n'est pas en guerre actuellement : rien à évaluer sur la semaine en cours.",
    copyList: 'Copier la liste',
    copied: 'Copié ! ✅',
    copyError: 'Impossible de copier.',
    noCandidates: 'Aucun membre problématique avec ce seuil.',
    insufficientBattles: 'Combats insuffisants cette semaine',
    battlesThisWeek: '{count}/16 combats cette semaine',
  },
  quarantine: {
    title: 'Sas de quarantaine',
    searching: 'Recherche des nouveaux membres...',
    analyzing: 'Analyse du profil en cours...',
    emptyTitle: 'Aucun nouveau membre',
    emptyDescription:
      'Tous les membres actuels ont déjà un historique de guerre chez nous.',
    totalBattles: 'Combats totaux',
    clanWarWins: 'Victoires GDC (vie)',
    copyKick: 'Copier Tag pour Kick',
  },
  weather: {
    title: 'La Météo du Clan',
    analyzing: 'Analyse des tendances...',
    emptyTitle: "Pas encore assez d'historique",
    emptyDescription:
      'Il faut au moins 5 semaines de guerre complètes pour dégager une tendance.',
    colPlayer: 'Joueur',
    colTrend: 'Tendance',
    colProfile: 'Profil',
    tableCaption: "Tendance d'assiduité des 5 dernières semaines par joueur",
  },
  playerDrawer: {
    title: 'Profil joueur',
    close: 'Fermer le panneau',
    role: 'Rôle',
    outOfClan: 'Hors clan',
    level: 'Niveau',
    totalDonations: 'Total de dons',
    deck: 'Deck',
    deckUnavailableTitle: 'Deck indisponible',
    deckUnavailableDescription: 'Ni deck actuel ni carte favorite dans ce profil.',
    loadingLabel: 'Chargement du profil joueur',
  },
  copyButton: {
    defaultLabel: 'Copier le tag',
    copied: '✓ Copié !',
  },
  playerProgressBar: {
    ariaLabel: '{score} combats sur {max}, {level}',
  },
  sparkline: {
    ariaLabel: 'Historique des {count} dernières semaines : {values} combats sur {max}',
  },
  roles: {
    leader: 'Chef',
    coLeader: 'Adjoint',
    elder: 'Aîné',
    member: 'Membre',
  },
  attendanceLevels: {
    complete: 'Complet',
    warning: 'Incomplet',
    critical: 'Critique',
  },
  reliabilityLevels: {
    red: 'À risque',
    orange: 'À surveiller',
    green: 'Bon profil',
    unknown: 'Profil neutre',
  },
  consistencyProfiles: {
    roc: 'Le Roc',
    decrocheur: 'Le Décrocheur',
    redemption: 'En Rédemption',
    touriste: 'Le Touriste',
    irregulier: 'Irrégulier',
  },
};

export default fr;
export type Dictionary = typeof fr;
