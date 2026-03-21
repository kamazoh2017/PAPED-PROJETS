/**
 * Seed script — Crée les 4 projets de suivi du développement de PAPE-D PROJECT TRACKER.
 * Idempotent : vérifie l'existence avant chaque création.
 * Usage : node scripts/seed-projects.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Données ────────────────────────────────────────────────────────────────

const PROJETS = [
  {
    libelle:
      "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 1 - v1 fondation",
    description:
      "Phase fondatrice de la plateforme : infrastructure technique, authentification, gestion des entités, personnes, comptes, projets, tâches (Kanban & Gantt), commentaires, historique, tableau de bord et calcul des risques.",
    statut: 'Terminé',
    taches: [
      {
        ordre: 1,
        libelle: 'Initialisation du projet Next.js 15 avec TypeScript',
        description:
          "Mise en place du dépôt Git, configuration de Next.js 15 (App Router), TypeScript strict, ESLint, Prettier et structure de dossiers src/app.",
        priorite: 'Bloquant',
        statut: 'Validé',
      },
      {
        ordre: 2,
        libelle: "Configuration Prisma ORM + SQLite (dev) / PostgreSQL (prod)",
        description:
          "Initialisation de Prisma, datasource SQLite pour le développement local et PostgreSQL pour Railway en production. Script de build Railway pour patcher le schema.",
        priorite: 'Bloquant',
        statut: 'Validé',
      },
      {
        ordre: 3,
        libelle: "Modèle de données fondateur (Entite, PersonneRessource, Projet, Tache)",
        description:
          "Définition des modèles Prisma principaux : Entite, PersonneRessource (avec estChefProjet), Projet, Tache avec tous leurs champs, relations et mappings de tables.",
        priorite: 'Bloquant',
        statut: 'Validé',
      },
      {
        ordre: 4,
        libelle: "Système d'authentification par cookie HTTP-only",
        description:
          "Création du modèle SessionAuth, hash bcrypt des mots de passe, API /api/auth/login et /api/auth/logout, cookie pape_session sécurisé (httpOnly, sameSite=strict).",
        priorite: 'Bloquant',
        statut: 'Validé',
      },
      {
        ordre: 5,
        libelle: "Middleware Edge pour protection des routes API",
        description:
          "middleware.ts à la racine : intercepte toutes les routes /api/* (sauf /api/auth/*) et retourne 401 si le cookie de session est absent.",
        priorite: 'Bloquant',
        statut: 'Validé',
      },
      {
        ordre: 6,
        libelle: "Helpers requireAuth() et canDo() pour les API routes",
        description:
          "lib/require-auth.ts : requireAuth() valide la session et charge l'utilisateur, canDo() vérifie les permissions par page/action, forbidden() retourne 403.",
        priorite: 'Bloquant',
        statut: 'Validé',
      },
      {
        ordre: 7,
        libelle: "Modèle de permissions par page/action (PermissionPageAction)",
        description:
          "Table permissions_page_action avec compteId, pageKey, actionKey, autorise. Interface d'administration pour gérer les autorisations par compte.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 8,
        libelle: "Super-admin seed idempotent au démarrage Railway",
        description:
          "Script scripts/railway-start.js : crée ou met à jour le compte super-admin depuis les variables d'environnement SUPER_ADMIN_* de façon idempotente.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 9,
        libelle: "CRUD Entités (API + page /entites)",
        description:
          "API /api/entites (GET/POST) et /api/entites/[id] (GET/PUT/DELETE). Page front-end avec liste, formulaire de création/édition et suppression.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 10,
        libelle: "CRUD Personnes ressources (API + page /personnes)",
        description:
          "API /api/personnes (GET/POST) et /api/personnes/[id] (GET/PUT/DELETE). Champs : nom, prénoms, téléphone, email, fonction, entité, estChefProjet. Validation unicité email/téléphone.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 11,
        libelle: "CRUD Comptes d'accès (API + page /comptes-acces)",
        description:
          "API /api/comptes-acces (GET/POST) et /api/comptes-acces/[id] (GET/PUT/DELETE). Création de compte lié à une personne, login par email ou téléphone (10 chiffres).",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 12,
        libelle: "Gestion des autorisations par compte (/comptes-acces/autorisations/[id])",
        description:
          "Page dédiée à la gestion des permissions d'un compte. Matrice de cases à cocher par page/action. API /api/comptes-acces/[id]/autorisations.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 13,
        libelle: "CRUD Projets (API + page /projets)",
        description:
          "API /api/projets (GET/POST) et /api/projets/[id] (GET/PUT/DELETE). Champs : libellé, description, statut, chefProjet, dates. Liste paginée avec indicateurs de progression.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 14,
        libelle: "Page détail projet avec onglets (Backlog, Kanban, Gantt, Équipe, Infos)",
        description:
          "app/projets/[id]/page.tsx : onglets Backlog, Kanban, Gantt, Équipe du projet et Informations générales. Navigation et gestion d'état centralisée.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 15,
        libelle: "Backlog des tâches : liste, création, priorités",
        description:
          "Onglet Backlog : liste des tâches triées par ordre, badges de priorité (Bloquant/Critique/Normal), formulaire de création rapide, glisser-déposer pour réordonner.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 16,
        libelle: "Vue Kanban des tâches par statut",
        description:
          "Onglet Kanban : colonnes À planifier, A faire, En cours, Terminé, Validé. Cartes déplaçables entre colonnes avec mise à jour du statut via API.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 17,
        libelle: "Diagramme de Gantt des tâches",
        description:
          "Onglet Gantt : visualisation temporelle des tâches avec barres de progression, composant ProjectGantt. Affichage des dates prévisionnelles et effectives.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 18,
        libelle: "Panel de détail d'une tâche (slide-over)",
        description:
          "Panneau latéral pour voir/éditer une tâche : libellé, description, priorité, statut, assignation, dates. Onglets Détails / Commentaires / Historique.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 19,
        libelle: "Assignation de tâche + ajout auto à l'équipe projet",
        description:
          "Lors de l'assignation d'une tâche à une personne, celle-ci est automatiquement ajoutée à l'équipe du projet (equipeProjet) si elle n'en fait pas encore partie.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 20,
        libelle: "Remplissage automatique des dates effectives selon le statut",
        description:
          "Quand une tâche passe au statut 'En cours', dateDebutEffective est remplie automatiquement. Quand elle passe à 'Terminé', dateFinEffective est remplie.",
        priorite: 'Normale',
        statut: 'Validé',
      },
      {
        ordre: 21,
        libelle: "Commentaires sur les tâches (API + UI)",
        description:
          "Modèle CommentaireTache avec support de réponses imbriquées (parentId). API /api/taches/[id]/commentaires. Affichage dans l'onglet Commentaires du panel.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 22,
        libelle: "Historique d'activité des tâches (ActiviteTache)",
        description:
          "Modèle ActiviteTache : enregistre création, changements de statut et réassignations. API /api/taches/[id]/activites. Timeline dans l'onglet Historique du panel.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 23,
        libelle: "Tableau de bord (/tableau-de-bord)",
        description:
          "Page synthèse : projets actifs avec barre de progression, distribution des tâches par statut, projets en retard, indicateurs de risque calculés et persistés.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 24,
        libelle: "Calcul et persistance des scores de risque projet",
        description:
          "Calcul de 5 indicateurs (retard, hors-délai, progression, suspendu, global) depuis les données de tâches. Upsert via /api/projets/[id]/risques avec clé unique [projetId, libelle].",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 25,
        libelle: "Gestion de l'équipe projet (onglet Équipe)",
        description:
          "Onglet Équipe du détail projet : liste des membres, ajout/retrait manuel, affichage du chef de projet. Les assignations de tâches alimentent aussi l'équipe.",
        priorite: 'Normale',
        statut: 'Validé',
      },
      {
        ordre: 26,
        libelle: "Navigation principale et composant PageHeader",
        description:
          "Navigation.tsx : menu latéral avec liens vers toutes les sections, indicateur de section active, bouton de déconnexion. PageHeader.tsx : en-tête de page réutilisable.",
        priorite: 'Normale',
        statut: 'Validé',
      },
      {
        ordre: 27,
        libelle: "Déploiement Railway (build + runtime idempotents)",
        description:
          "Scripts scripts/railway-build.js et scripts/railway-start.js. Gestion du patch SQLite→PostgreSQL, prisma db push, seed super-admin. Variables d'environnement Railway documentées.",
        priorite: 'Critique',
        statut: 'Validé',
      },
      {
        ordre: 28,
        libelle: "Login par email ou numéro de téléphone (10 chiffres)",
        description:
          "L'identifiant de connexion accepte soit l'email, soit le numéro de téléphone à 10 chiffres de la personne ressource liée au compte. Validation côté serveur.",
        priorite: 'Normale',
        statut: 'Validé',
      },
      {
        ordre: 29,
        libelle: "Sous-tâches en checklist avec délai et assignation",
        description:
          "Modèle SousTache : libellé, assigneAId (optionnel), dateEcheance (optionnelle), estCochee. Visibilité : le propriétaire de la tâche voit toutes les sous-tâches, l'assigné ne voit que les siennes. Auto-progression : première case cochée → tâche 'En cours', toutes cochées → tâche 'Terminé'.",
        priorite: 'Critique',
        statut: 'A faire',
      },
      {
        ordre: 30,
        libelle: "Jalons de projet avec livrables nominatifs",
        description:
          "Modèle JalonProjet : titre, description, datePrevisionnelle, dateEffective, statut calculé (À venir / Atteint / En retard). Livrables nominatifs liés aux jalons ET aux tâches (modèle Livrable). Affichage dans la page projet.",
        priorite: 'Critique',
        statut: 'A faire',
      },
    ],
  },
  {
    libelle:
      "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 2 - v1 affiner fondation",
    description:
      "Consolidation de la fondation : amélioration de l'expérience utilisateur, gestion des parties prenantes, tâches périodiques, interface d'administration des permissions et édition des entités.",
    statut: 'En démarrage',
    taches: [
      {
        ordre: 1,
        libelle: "Interface d'édition du flag estChefProjet sur une personne",
        description:
          "Ajouter dans la page ou le formulaire d'édition d'une personne ressource la possibilité de cocher/décocher 'Est chef de projet', avec persistance via l'API PUT /api/personnes/[id].",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 2,
        libelle: "CRUD Parties prenantes (API + UI dans le détail projet)",
        description:
          "Modèle PartiePrenante déjà en base. Créer les API routes manquantes et l'interface dans l'onglet Informations du projet pour gérer les parties prenantes (ajout, édition, suppression).",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 3,
        libelle: "Module tâches périodiques (API + page /taches-periodiques)",
        description:
          "Modèle TachePerodique déjà en base. Créer les API routes CRUD et la page de gestion des tâches périodiques avec périodicité, responsable, entité d'exécution et suivi du statut.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 4,
        libelle: "UI adaptive selon les permissions (masquer sections non autorisées)",
        description:
          "Côté front-end, vérifier les permissions de l'utilisateur connecté et masquer/désactiver les boutons et sections auxquels il n'a pas accès (ex: bouton Créer projet, onglet Équipe).",
        priorite: 'Critique',
        statut: 'À planifier',
      },
      {
        ordre: 5,
        libelle: "Page profil utilisateur (modifier son mot de passe)",
        description:
          "Page /profil permettant à l'utilisateur connecté de modifier son mot de passe. Workflow doitChangerMdp : redirection forcée à la première connexion.",
        priorite: 'Critique',
        statut: 'À planifier',
      },
      {
        ordre: 6,
        libelle: "Édition des entités depuis la page /entites",
        description:
          "Formulaire d'édition inline ou en modal pour modifier le libellé et la tutelle d'une entité existante. API PUT /api/entites/[id] (à créer).",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 7,
        libelle: "Désactivation/réactivation de comptes d'accès",
        description:
          "Ajouter un bouton Désactiver/Réactiver sur la page des comptes d'accès. Un compte désactivé (estActif=false) ne peut plus se connecter. API PATCH /api/comptes-acces/[id]/statut.",
        priorite: 'Critique',
        statut: 'À planifier',
      },
      {
        ordre: 8,
        libelle: "Réordonnancement drag-and-drop du backlog",
        description:
          "Permettre le réordonnancement des tâches dans le Backlog par glisser-déposer avec persistance du champ 'ordre' via appel API PATCH bulk.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
    ],
  },
  {
    libelle:
      "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 3 - v1 fondation plus",
    description:
      "Enrichissement de la plateforme : tableau de bord personnel, filtres avancés, recherche globale, sécurité (réinitialisation MDP), notifications in-app, historique projet, export PDF et jalons dans le Gantt.",
    statut: 'En démarrage',
    taches: [
      {
        ordre: 1,
        libelle: "Vue 'Mes tâches' dans le tableau de bord",
        description:
          "Section personnalisée dans le tableau de bord affichant uniquement les tâches assignées à l'utilisateur connecté, triées par priorité et date d'échéance.",
        priorite: 'Critique',
        statut: 'À planifier',
      },
      {
        ordre: 2,
        libelle: "Filtres sur la page projets (statut, chef de projet, période)",
        description:
          "Ajouter des filtres sur la liste des projets : par statut (En démarrage, En cours, Terminé…), par chef de projet, par fourchette de dates.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 3,
        libelle: "Filtres dans le Backlog et le Kanban (priorité, assigné, statut)",
        description:
          "Barre de filtres dans les onglets Backlog et Kanban du détail projet : filtrer par priorité, assigné, statut. Filtre persisté en mémoire le temps de la session.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 4,
        libelle: "Recherche globale (projets, tâches, personnes)",
        description:
          "Barre de recherche dans la navigation principale retournant des résultats multi-entités : projets, tâches, personnes ressources. Raccourci clavier Ctrl+K.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 5,
        libelle: "Réinitialisation du mot de passe par l'admin",
        description:
          "Action admin sur un compte : générer un mot de passe temporaire et mettre doitChangerMdp=true, forçant l'utilisateur à changer son mot de passe à la prochaine connexion.",
        priorite: 'Critique',
        statut: 'À planifier',
      },
      {
        ordre: 6,
        libelle: "Notifications in-app (assignation, commentaire, changement statut)",
        description:
          "Système de notifications internes : création d'un modèle Notification, endpoint SSE ou polling, cloche dans la navigation avec badge de comptage non-lus.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 7,
        libelle: "Historique des modifications du projet (journal)",
        description:
          "Enregistrement des événements projet : changement de statut, ajout/retrait de membres, modification des informations générales. Affichage dans un onglet Journal du détail projet.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 8,
        libelle: "Export PDF du rapport de projet",
        description:
          "Bouton 'Exporter PDF' dans le détail projet générant un rapport avec informations générales, liste des tâches, équipe, jalons et indicateurs de risque.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 9,
        libelle: "Affichage des jalons dans le diagramme de Gantt",
        description:
          "Intégrer les jalons de projet (JalonProjet) dans la vue Gantt comme marqueurs de point-dans-le-temps distincts des barres de tâches, avec indicateur de statut coloré.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
    ],
  },
  {
    libelle:
      "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: Phase 4 - v2",
    description:
      "Évolutions majeures de la plateforme vers la version 2 : notifications email, pièces jointes, sous-tâches hiérarchiques avancées, vue calendrier, rapports avancés, gestion budgétaire, dashboard personnalisable, PWA, API Swagger et multi-organisations.",
    statut: 'En démarrage',
    taches: [
      {
        ordre: 1,
        libelle: "Notifications par email (assignation, rappels d'échéance)",
        description:
          "Envoi d'emails transactionnels via SMTP/SendGrid : notification d'assignation à une tâche, rappel J-1 avant échéance. Configuration des préférences par utilisateur.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 2,
        libelle: "Pièces jointes sur tâches et commentaires",
        description:
          "Upload de fichiers associés aux tâches et commentaires. Stockage S3/R2 ou équivalent. Modèle PieceJointe avec tacheId ou commentaireId, taille, type MIME, URL.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 3,
        libelle: "Sous-tâches hiérarchiques V2 (tâches enfants complètes)",
        description:
          "Extension au-delà des checklists : sous-tâches avec leur propre assignation, priorité, dates, statut Kanban et intégration dans le Gantt. Profondeur 1 niveau.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 4,
        libelle: "Vue calendrier des tâches et jalons",
        description:
          "Vue calendrier mensuelle/hebdomadaire affichant les tâches (par date d'échéance) et les jalons. Navigation temporelle, drag-and-drop pour modifier les dates.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 5,
        libelle: "Rapports avancés (burndown, vélocité, taux de complétion)",
        description:
          "Section Rapports avec graphiques : burndown chart, vélocité de l'équipe, taux de complétion par période. Export CSV des données.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 6,
        libelle: "Gestion budgétaire des projets",
        description:
          "Champs budget alloué et budget consommé sur les projets. Possibilité de ventiler le budget par tâche ou phase. Indicateurs d'écart budgétaire dans le tableau de bord.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 7,
        libelle: "Dashboard personnalisable (widgets drag-and-drop)",
        description:
          "Permettre à chaque utilisateur de personnaliser son tableau de bord en ajoutant, supprimant et réorganisant des widgets (mes tâches, projets actifs, indicateurs, etc.).",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 8,
        libelle: "PWA / expérience mobile optimisée",
        description:
          "Transformer la plateforme en Progressive Web App : manifest, service worker, expérience hors-ligne basique, icônes, écran de démarrage. Interface responsive mobile-first.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 9,
        libelle: "Documentation API Swagger / OpenAPI",
        description:
          "Génération automatique de la documentation OpenAPI à partir des routes Next.js. Interface Swagger UI accessible à /api/docs pour les développeurs.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
      {
        ordre: 10,
        libelle: "Support multi-organisations (tenants)",
        description:
          "Isolation des données par organisation : modèle Organisation, clé étrangère sur toutes les entités, sous-domaine ou path-based routing par tenant.",
        priorite: 'Normale',
        statut: 'À planifier',
      },
    ],
  },
];

// ─── Script principal ────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Démarrage du seed des projets PAPE-D...\n');

  // Trouver un chef de projet (estChefProjet=true en priorité, sinon le premier disponible)
  let chefProjet = await prisma.personneRessource.findFirst({
    where: { estChefProjet: true },
    orderBy: { dateCreation: 'asc' },
  });

  if (!chefProjet) {
    chefProjet = await prisma.personneRessource.findFirst({
      orderBy: { dateCreation: 'asc' },
    });
  }

  if (!chefProjet) {
    console.error(
      '❌ Aucune personne ressource trouvée.\n' +
        '   Créez d\'abord au moins une personne dans l\'application.'
    );
    process.exit(1);
  }

  console.log(`👤 Chef de projet utilisé : ${chefProjet.prenoms} ${chefProjet.nom}\n`);

  let projetsCreés = 0;
  let projetsExistants = 0;
  let tachesCreées = 0;

  for (const projetData of PROJETS) {
    const { taches, ...projetFields } = projetData;

    // Vérifier si le projet existe déjà
    const existant = await prisma.projet.findUnique({
      where: { libelle: projetFields.libelle },
      include: { taches: { select: { libelle: true } } },
    });

    let projetId;

    if (existant) {
      console.log(`⏭️  Projet déjà existant : "${projetFields.libelle.slice(0, 70)}..."`);
      projetId = existant.id;
      projetsExistants++;
    } else {
      const projet = await prisma.projet.create({
        data: {
          ...projetFields,
          chefProjetId: chefProjet.id,
        },
      });
      projetId = projet.id;
      projetsCreés++;
      console.log(`✅ Projet créé : "${projetFields.libelle.slice(0, 70)}..."`);
    }

    // Créer les tâches manquantes
    const tachesExistantes = existant
      ? new Set(existant.taches.map((t) => t.libelle))
      : new Set();

    for (const tache of taches) {
      if (tachesExistantes.has(tache.libelle)) {
        continue; // déjà présente
      }
      await prisma.tache.create({
        data: {
          projetId,
          libelle: tache.libelle,
          description: tache.description,
          priorite: tache.priorite,
          statut: tache.statut,
          ordre: tache.ordre,
        },
      });
      tachesCreées++;
    }

    const tachesAjoutées = taches.length - tachesExistantes.size;
    if (tachesAjoutées > 0) {
      console.log(`   └─ ${tachesAjoutées} tâche(s) ajoutée(s)`);
    } else {
      console.log(`   └─ Toutes les tâches existent déjà`);
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed terminé.
   Projets créés   : ${projetsCreés}
   Projets ignorés : ${projetsExistants}
   Tâches créées   : ${tachesCreées}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
