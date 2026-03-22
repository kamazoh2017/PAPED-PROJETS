/**
 * Seed script — Crée les 4 projets avec dates, métriques et risques.
 * Idempotent (upsert). Usage : node scripts/seed-projects.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helpers dates ────────────────────────────────────────────────────────────

function d(year, month, day) {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function addDays(date, n) {
  const r = new Date(date.getTime());
  r.setDate(r.getDate() + n);
  return r;
}

function daysDiff(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function randInt(min, max) {
  if (max < min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Assigne des dates aléatoires à chaque tâche dans [projectStart, projectEnd].
 * Tâches Validé/Terminé : debutPrev = debutEff, finPrev = finEff.
 * Autres statuts        : uniquement debutPrev et finPrev (pas d'effectif).
 */
function assignTaskDates(tasks, projectStart, projectEnd) {
  const totalDays = daysDiff(projectStart, projectEnd);
  return tasks.map((task) => {
    const s = String(task.statut ?? '').trim().toLowerCase();
    const isCompleted =
      s === 'validé' || s === 'valide' || s === 'terminé' || s === 'termine';

    const startOff = randInt(0, Math.max(0, totalDays - 1));
    const maxDur   = Math.min(2, Math.max(0, totalDays - startOff));
    const duration = randInt(0, maxDur);

    const debutPrev = addDays(projectStart, startOff);
    const finPrev   = addDays(projectStart, startOff + duration);

    return {
      ...task,
      dateDebutPrevisionnelle: debutPrev,
      dateFinPrevisionnelle:   finPrev,
      dateDebutEffective:      isCompleted ? debutPrev : null,
      dateFinEffective:        null,
    };
  });
}

// ─── Helpers métriques ────────────────────────────────────────────────────────

function getTaskProgression(statut) {
  const s = String(statut ?? '').trim().toLowerCase();
  if (s === 'à planifier' || s === 'a planifier' || s === 'a faire' || s === 'à faire') return 0;
  if (s === 'en cours')   return 50;
  if (s === 'en attente') return 40;
  if (s === 'terminé' || s === 'termine') return 90;
  if (s === 'validé'  || s === 'valide')  return 100;
  return 0;
}

function getPriorityWeight(priorite) {
  const p = String(priorite ?? '').trim().toLowerCase();
  if (p === 'bloquant') return 3;
  if (p === 'critique') return 2;
  return 1;
}

function isTaskDone(statut) {
  const s = String(statut ?? '').trim().toLowerCase();
  return s === 'terminé' || s === 'termine' || s === 'validé' || s === 'valide';
}

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

function computeTauxAvancementReel(tasks) {
  if (!tasks.length) return 0;
  const ws = tasks.reduce((a, t) => a + getTaskProgression(t.statut) * getPriorityWeight(t.priorite), 0);
  const tw = tasks.reduce((a, t) => a + getPriorityWeight(t.priorite), 0);
  return tw ? Math.round(ws / tw) : 0;
}

function getTaskExpectedProgression(task, nowTs) {
  const debut = task.dateDebutPrevisionnelle ? task.dateDebutPrevisionnelle.getTime() : null;
  const fin   = task.dateFinPrevisionnelle   ? task.dateFinPrevisionnelle.getTime()   : null;
  if (!debut || !fin || fin <= debut) return 0;
  if (nowTs < debut) return 0;
  if (nowTs >= fin)  return 100;
  return clamp(((nowTs - debut) / (fin - debut)) * 100);
}

function computeTauxAvancementAttendu(tasks, nowTs) {
  if (!tasks.length) return 0;
  const ws = tasks.reduce((a, t) => a + getTaskExpectedProgression(t, nowTs) * getPriorityWeight(t.priorite), 0);
  const tw = tasks.reduce((a, t) => a + getPriorityWeight(t.priorite), 0);
  return tw ? Math.round(ws / tw) : 0;
}

function computeTauxAchevementReel(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => isTaskDone(t.statut)).length / tasks.length) * 100);
}

function computeTauxAchevementAttendu(tasks, nowTs) {
  if (!tasks.length) return 0;
  const due = tasks.filter((t) => {
    const fp = t.dateFinPrevisionnelle ? t.dateFinPrevisionnelle.getTime() : null;
    return fp !== null && nowTs >= fp;
  }).length;
  return Math.round((due / tasks.length) * 100);
}

function computeEtatAvancementProjet(project, avancReel, avancAtt, nowTs) {
  const statut  = String(project.statut ?? '').trim().toLowerCase();
  const finPrev = project.dateFinPrevisionnelle ? project.dateFinPrevisionnelle.getTime() : null;
  const finEff  = project.dateFinEffective      ? project.dateFinEffective.getTime()      : null;

  if (statut === 'terminé' || statut === 'termine' || statut === 'clôturé' || statut === 'cloture') {
    if (finEff !== null && finPrev !== null) {
      if (finEff < finPrev)  return 'en-avance';
      if (finEff === finPrev) return 'a-lheure';
      return 'hors-delai';
    }
    return 'a-lheure';
  }
  if (finPrev !== null && nowTs > finPrev) return 'hors-delai';
  const ecart = avancReel - avancAtt;
  if (ecart > 10)  return 'en-avance';
  if (ecart < -10) return 'retard';
  return 'a-lheure';
}

function computeTaskEtatAvancement(task, nowTs) {
  const s         = String(task.statut ?? '').trim().toLowerCase();
  const finPrev   = task.dateFinPrevisionnelle   ? task.dateFinPrevisionnelle.getTime()   : null;
  const debutPrev = task.dateDebutPrevisionnelle ? task.dateDebutPrevisionnelle.getTime() : null;
  const finEff    = task.dateFinEffective        ? task.dateFinEffective.getTime()        : null;
  const debutEff  = task.dateDebutEffective      ? task.dateDebutEffective.getTime()      : null;

  if (s === 'terminé' || s === 'termine' || s === 'validé' || s === 'valide') {
    if (finEff !== null && finPrev !== null) {
      if (finEff < finPrev)   return 'en-avance';
      if (finEff === finPrev) return 'a-lheure';
      return 'hors-delai';
    }
    return 'a-lheure';
  }
  if (s === 'en cours') {
    if (debutEff !== null && debutPrev !== null && debutEff < debutPrev) return 'en-avance';
    if (finPrev !== null && nowTs >= finPrev) return 'retard';
    return 'a-lheure';
  }
  if (s === 'a faire' || s === 'à faire') {
    if (finPrev !== null && nowTs > finPrev)    return 'hors-delai';
    if (debutPrev !== null && nowTs >= debutPrev) return 'retard';
    return 'a-lheure';
  }
  if (s === 'en attente') {
    if (finPrev !== null && nowTs > finPrev) return 'hors-delai';
    return 'a-lheure';
  }
  return 'a-lheure';
}

function computeRiskScores(tasks, nowTs) {
  const total = tasks.length;
  if (!total) return { retard: 0, horsDelai: 0, progression: 0, suspendu: 0, global: 0 };

  const done = tasks.filter((t) => isTaskDone(t.statut));

  const retardCount = tasks.filter((t) => {
    const fp = t.dateFinPrevisionnelle ? t.dateFinPrevisionnelle.getTime() : null;
    return fp !== null && nowTs > fp && !isTaskDone(t.statut);
  }).length;

  const horsDelaiCount = done.filter((t) => {
    const fp = t.dateFinPrevisionnelle ? t.dateFinPrevisionnelle.getTime() : null;
    const fe = t.dateFinEffective      ? t.dateFinEffective.getTime()      : null;
    return fp !== null && fe !== null && fe > fp;
  }).length;

  const critiques         = tasks.filter((t) => getPriorityWeight(t.priorite) === 2).length;
  const critiquesEnAttente = tasks.filter(
    (t) => getPriorityWeight(t.priorite) === 2 &&
           String(t.statut ?? '').trim().toLowerCase() === 'en attente',
  ).length;

  const retard      = clamp((total       ? retardCount      / total       : 0) * 100);
  const horsDelai   = clamp((done.length ? horsDelaiCount   / done.length : 0) * 100);
  const suspendu    = clamp((critiques   ? critiquesEnAttente / critiques  : 0) * 100);
  const avancReel   = computeTauxAvancementReel(tasks);
  const avancAtt    = computeTauxAvancementAttendu(tasks, nowTs);
  const progression = clamp(Math.max(0, avancAtt - avancReel));
  const global      = clamp(0.3 * retard + 0.2 * horsDelai + 0.3 * progression + 0.2 * suspendu);

  return { retard, horsDelai, progression, suspendu, global };
}

function getRiskLevel(score) {
  if (score <= 25) return 'Faible';
  if (score <= 50) return 'Moyen';
  if (score <= 75) return 'Élevé';
  return 'Critique';
}

function getRiskColor(score) {
  if (score <= 25) return 'Vert';
  if (score <= 50) return 'Jaune';
  if (score <= 75) return 'Orange';
  return 'Rouge';
}

// ─── Données projets ──────────────────────────────────────────────────────────

const PROJETS = [
  // ── Phase 1 : 17 → 24 mars 2026 ─────────────────────────────────────────
  {
    libelle: "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 1 - v1 fondation",
    description:
      "Phase fondatrice de la plateforme : infrastructure technique, authentification, gestion des entités, personnes, comptes, projets, tâches (Kanban & Gantt), commentaires, historique, tableau de bord et calcul des risques.",
    statut: 'Terminé',
    dateDebutPrevisionnelle: d(2026, 3, 17),
    dateFinPrevisionnelle:   d(2026, 3, 24),
    dateDebutEffective:      d(2026, 3, 17),
    dateFinEffective:        null,
    taches: [
      { ordre: 1,  priorite: 'Bloquant', statut: 'Validé', libelle: 'Initialisation du projet Next.js 15 avec TypeScript', description: "Mise en place du dépôt Git, configuration de Next.js 15 (App Router), TypeScript strict, ESLint, Prettier et structure de dossiers src/app." },
      { ordre: 2,  priorite: 'Bloquant', statut: 'Validé', libelle: "Configuration Prisma ORM + SQLite (dev) / PostgreSQL (prod)", description: "Initialisation de Prisma, datasource SQLite pour le développement local et PostgreSQL pour Railway en production. Script de build Railway pour patcher le schema." },
      { ordre: 3,  priorite: 'Bloquant', statut: 'Validé', libelle: "Modèle de données fondateur (Entite, PersonneRessource, Projet, Tache)", description: "Définition des modèles Prisma principaux : Entite, PersonneRessource (avec estChefProjet), Projet, Tache avec tous leurs champs, relations et mappings de tables." },
      { ordre: 4,  priorite: 'Bloquant', statut: 'Validé', libelle: "Système d'authentification par cookie HTTP-only", description: "Création du modèle SessionAuth, hash bcrypt des mots de passe, API /api/auth/login et /api/auth/logout, cookie pape_session sécurisé (httpOnly, sameSite=strict)." },
      { ordre: 5,  priorite: 'Bloquant', statut: 'Validé', libelle: "Middleware Edge pour protection des routes API", description: "middleware.ts à la racine : intercepte toutes les routes /api/* (sauf /api/auth/*) et retourne 401 si le cookie de session est absent." },
      { ordre: 6,  priorite: 'Bloquant', statut: 'Validé', libelle: "Helpers requireAuth() et canDo() pour les API routes", description: "lib/require-auth.ts : requireAuth() valide la session et charge l'utilisateur, canDo() vérifie les permissions par page/action, forbidden() retourne 403." },
      { ordre: 7,  priorite: 'Critique', statut: 'Validé', libelle: "Modèle de permissions par page/action (PermissionPageAction)", description: "Table permissions_page_action avec compteId, pageKey, actionKey, autorise. Interface d'administration pour gérer les autorisations par compte." },
      { ordre: 8,  priorite: 'Critique', statut: 'Validé', libelle: "Super-admin seed idempotent au démarrage Railway", description: "Script scripts/railway-start.js : crée ou met à jour le compte super-admin depuis les variables d'environnement SUPER_ADMIN_* de façon idempotente." },
      { ordre: 9,  priorite: 'Critique', statut: 'Validé', libelle: "CRUD Entités (API + page /entites)", description: "API /api/entites (GET/POST) et /api/entites/[id] (GET/PUT/DELETE). Page front-end avec liste, formulaire de création/édition et suppression." },
      { ordre: 10, priorite: 'Critique', statut: 'Validé', libelle: "CRUD Personnes ressources (API + page /personnes)", description: "API /api/personnes (GET/POST) et /api/personnes/[id] (GET/PUT/DELETE). Champs : nom, prénoms, téléphone, email, fonction, entité, estChefProjet. Validation unicité email/téléphone." },
      { ordre: 11, priorite: 'Critique', statut: 'Validé', libelle: "CRUD Comptes d'accès (API + page /comptes-acces)", description: "API /api/comptes-acces (GET/POST) et /api/comptes-acces/[id] (GET/PUT/DELETE). Création de compte lié à une personne, login par email ou téléphone (10 chiffres)." },
      { ordre: 12, priorite: 'Critique', statut: 'Validé', libelle: "Gestion des autorisations par compte (/comptes-acces/autorisations/[id])", description: "Page dédiée à la gestion des permissions d'un compte. Matrice de cases à cocher par page/action. API /api/comptes-acces/[id]/autorisations." },
      { ordre: 13, priorite: 'Critique', statut: 'Validé', libelle: "CRUD Projets (API + page /projets)", description: "API /api/projets (GET/POST) et /api/projets/[id] (GET/PUT/DELETE). Champs : libellé, description, statut, chefProjet, dates. Liste paginée avec indicateurs de progression." },
      { ordre: 14, priorite: 'Critique', statut: 'Validé', libelle: "Page détail projet avec onglets (Backlog, Kanban, Gantt, Équipe, Infos)", description: "app/projets/[id]/page.tsx : onglets Backlog, Kanban, Gantt, Équipe du projet et Informations générales. Navigation et gestion d'état centralisée." },
      { ordre: 15, priorite: 'Critique', statut: 'Validé', libelle: "Backlog des tâches : liste, création, priorités", description: "Onglet Backlog : liste des tâches triées par ordre, badges de priorité (Bloquant/Critique/Normal), formulaire de création rapide, glisser-déposer pour réordonner." },
      { ordre: 16, priorite: 'Critique', statut: 'Validé', libelle: "Vue Kanban des tâches par statut", description: "Onglet Kanban : colonnes À planifier, A faire, En cours, Terminé, Validé. Cartes déplaçables entre colonnes avec mise à jour du statut via API." },
      { ordre: 17, priorite: 'Critique', statut: 'Validé', libelle: "Diagramme de Gantt des tâches", description: "Onglet Gantt : visualisation temporelle des tâches avec barres de progression, composant ProjectGantt. Affichage des dates prévisionnelles et effectives." },
      { ordre: 18, priorite: 'Critique', statut: 'Validé', libelle: "Panel de détail d'une tâche (slide-over)", description: "Panneau latéral pour voir/éditer une tâche : libellé, description, priorité, statut, assignation, dates. Onglets Détails / Commentaires / Historique." },
      { ordre: 19, priorite: 'Critique', statut: 'Validé', libelle: "Assignation de tâche + ajout auto à l'équipe projet", description: "Lors de l'assignation d'une tâche à une personne, celle-ci est automatiquement ajoutée à l'équipe du projet (equipeProjet) si elle n'en fait pas encore partie." },
      { ordre: 20, priorite: 'Normal',   statut: 'Validé', libelle: "Remplissage automatique des dates effectives selon le statut", description: "Quand une tâche passe au statut 'En cours', dateDebutEffective est remplie automatiquement. Quand elle passe à 'Terminé', dateFinEffective est remplie." },
      { ordre: 21, priorite: 'Critique', statut: 'Validé', libelle: "Commentaires sur les tâches (API + UI)", description: "Modèle CommentaireTache avec support de réponses imbriquées (parentId). API /api/taches/[id]/commentaires. Affichage dans l'onglet Commentaires du panel." },
      { ordre: 22, priorite: 'Critique', statut: 'Validé', libelle: "Historique d'activité des tâches (ActiviteTache)", description: "Modèle ActiviteTache : enregistre création, changements de statut et réassignations. API /api/taches/[id]/activites. Timeline dans l'onglet Historique du panel." },
      { ordre: 23, priorite: 'Critique', statut: 'Validé', libelle: "Tableau de bord (/tableau-de-bord)", description: "Page synthèse : projets actifs avec barre de progression, distribution des tâches par statut, projets en retard, indicateurs de risque calculés et persistés." },
      { ordre: 24, priorite: 'Critique', statut: 'Validé', libelle: "Calcul et persistance des scores de risque projet", description: "Calcul de 5 indicateurs (retard, hors-délai, progression, suspendu, global) depuis les données de tâches. Upsert via /api/projets/[id]/risques avec clé unique [projetId, libelle]." },
      { ordre: 25, priorite: 'Normal',   statut: 'Validé', libelle: "Gestion de l'équipe projet (onglet Équipe)", description: "Onglet Équipe du détail projet : liste des membres, ajout/retrait manuel, affichage du chef de projet. Les assignations de tâches alimentent aussi l'équipe." },
      { ordre: 26, priorite: 'Normal',   statut: 'Validé', libelle: "Navigation principale et composant PageHeader", description: "Navigation.tsx : menu latéral avec liens vers toutes les sections, indicateur de section active, bouton de déconnexion. PageHeader.tsx : en-tête de page réutilisable." },
      { ordre: 27, priorite: 'Critique', statut: 'Validé', libelle: "Déploiement Railway (build + runtime idempotents)", description: "Scripts scripts/railway-build.js et scripts/railway-start.js. Gestion du patch SQLite→PostgreSQL, prisma db push, seed super-admin. Variables d'environnement Railway documentées." },
      { ordre: 28, priorite: 'Normal',   statut: 'Validé', libelle: "Login par email ou numéro de téléphone (10 chiffres)", description: "L'identifiant de connexion accepte soit l'email, soit le numéro de téléphone à 10 chiffres de la personne ressource liée au compte. Validation côté serveur." },
      { ordre: 29, priorite: 'Critique', statut: 'A faire', libelle: "Sous-tâches en checklist avec délai et assignation", description: "Modèle SousTache : libellé, assigneAId (optionnel), dateEcheance (optionnelle), estCochee. Visibilité : le propriétaire de la tâche voit toutes les sous-tâches, l'assigné ne voit que les siennes. Auto-progression : première case cochée → tâche 'En cours', toutes cochées → tâche 'Terminé'." },
      { ordre: 30, priorite: 'Critique', statut: 'A faire', libelle: "Jalons de projet avec livrables nominatifs", description: "Modèle JalonProjet : titre, description, datePrevisionnelle, dateEffective, statut calculé (À venir / Atteint / En retard). Livrables nominatifs liés aux jalons ET aux tâches (modèle Livrable). Affichage dans la page projet." },
    ],
  },

  // ── Phase 2 : 25 → 26 mars 2026 (2 jours) ───────────────────────────────
  {
    libelle: "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 2 - v1 affiner fondation",
    description:
      "Consolidation de la fondation : amélioration de l'expérience utilisateur, gestion des parties prenantes, tâches périodiques, interface d'administration des permissions et édition des entités.",
    statut: 'En démarrage',
    dateDebutPrevisionnelle: d(2026, 3, 25),
    dateFinPrevisionnelle:   d(2026, 3, 26),
    dateDebutEffective:      null,
    dateFinEffective:        null,
    taches: [
      { ordre: 1, priorite: 'Normal',   statut: 'À planifier', libelle: "Interface d'édition du flag estChefProjet sur une personne", description: "Ajouter dans la page ou le formulaire d'édition d'une personne ressource la possibilité de cocher/décocher 'Est chef de projet', avec persistance via l'API PUT /api/personnes/[id]." },
      { ordre: 2, priorite: 'Normal',   statut: 'À planifier', libelle: "CRUD Parties prenantes (API + UI dans le détail projet)", description: "Modèle PartiePrenante déjà en base. Créer les API routes manquantes et l'interface dans l'onglet Informations du projet pour gérer les parties prenantes (ajout, édition, suppression)." },
      { ordre: 3, priorite: 'Normal',   statut: 'À planifier', libelle: "Module tâches périodiques (API + page /taches-periodiques)", description: "Modèle TachePerodique déjà en base. Créer les API routes CRUD et la page de gestion des tâches périodiques avec périodicité, responsable, entité d'exécution et suivi du statut." },
      { ordre: 4, priorite: 'Critique', statut: 'À planifier', libelle: "UI adaptive selon les permissions (masquer sections non autorisées)", description: "Côté front-end, vérifier les permissions de l'utilisateur connecté et masquer/désactiver les boutons et sections auxquels il n'a pas accès (ex: bouton Créer projet, onglet Équipe)." },
      { ordre: 5, priorite: 'Critique', statut: 'À planifier', libelle: "Page profil utilisateur (modifier son mot de passe)", description: "Page /profil permettant à l'utilisateur connecté de modifier son mot de passe. Workflow doitChangerMdp : redirection forcée à la première connexion." },
      { ordre: 6, priorite: 'Normal',   statut: 'À planifier', libelle: "Édition des entités depuis la page /entites", description: "Formulaire d'édition inline ou en modal pour modifier le libellé et la tutelle d'une entité existante. API PUT /api/entites/[id] (à créer)." },
      { ordre: 7, priorite: 'Critique', statut: 'À planifier', libelle: "Désactivation/réactivation de comptes d'accès", description: "Ajouter un bouton Désactiver/Réactiver sur la page des comptes d'accès. Un compte désactivé (estActif=false) ne peut plus se connecter. API PATCH /api/comptes-acces/[id]/statut." },
      { ordre: 8, priorite: 'Normal',   statut: 'À planifier', libelle: "Réordonnancement drag-and-drop du backlog", description: "Permettre le réordonnancement des tâches dans le Backlog par glisser-déposer avec persistance du champ 'ordre' via appel API PATCH bulk." },
    ],
  },

  // ── Phase 3 : 27 → 28 mars 2026 (2 jours) ───────────────────────────────
  {
    libelle: "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 3 - v1 fondation plus",
    description:
      "Enrichissement de la plateforme : tableau de bord personnel, filtres avancés, recherche globale, sécurité (réinitialisation MDP), notifications in-app, historique projet, export PDF et jalons dans le Gantt.",
    statut: 'En démarrage',
    dateDebutPrevisionnelle: d(2026, 3, 27),
    dateFinPrevisionnelle:   d(2026, 3, 28),
    dateDebutEffective:      null,
    dateFinEffective:        null,
    taches: [
      { ordre: 1, priorite: 'Critique', statut: 'À planifier', libelle: "Vue 'Mes tâches' dans le tableau de bord", description: "Section personnalisée dans le tableau de bord affichant uniquement les tâches assignées à l'utilisateur connecté, triées par priorité et date d'échéance." },
      { ordre: 2, priorite: 'Normal',   statut: 'À planifier', libelle: "Filtres sur la page projets (statut, chef de projet, période)", description: "Ajouter des filtres sur la liste des projets : par statut (En démarrage, En cours, Terminé…), par chef de projet, par fourchette de dates." },
      { ordre: 3, priorite: 'Normal',   statut: 'À planifier', libelle: "Filtres dans le Backlog et le Kanban (priorité, assigné, statut)", description: "Barre de filtres dans les onglets Backlog et Kanban du détail projet : filtrer par priorité, assigné, statut. Filtre persisté en mémoire le temps de la session." },
      { ordre: 4, priorite: 'Normal',   statut: 'À planifier', libelle: "Recherche globale (projets, tâches, personnes)", description: "Barre de recherche dans la navigation principale retournant des résultats multi-entités : projets, tâches, personnes ressources. Raccourci clavier Ctrl+K." },
      { ordre: 5, priorite: 'Critique', statut: 'À planifier', libelle: "Réinitialisation du mot de passe par l'admin", description: "Action admin sur un compte : générer un mot de passe temporaire et mettre doitChangerMdp=true, forçant l'utilisateur à changer son mot de passe à la prochaine connexion." },
      { ordre: 6, priorite: 'Normal',   statut: 'À planifier', libelle: "Notifications in-app (assignation, commentaire, changement statut)", description: "Système de notifications internes : création d'un modèle Notification, endpoint SSE ou polling, cloche dans la navigation avec badge de comptage non-lus." },
      { ordre: 7, priorite: 'Normal',   statut: 'À planifier', libelle: "Historique des modifications du projet (journal)", description: "Enregistrement des événements projet : changement de statut, ajout/retrait de membres, modification des informations générales. Affichage dans un onglet Journal du détail projet." },
      { ordre: 8, priorite: 'Normal',   statut: 'À planifier', libelle: "Export PDF du rapport de projet", description: "Bouton 'Exporter PDF' dans le détail projet générant un rapport avec informations générales, liste des tâches, équipe, jalons et indicateurs de risque." },
      { ordre: 9, priorite: 'Normal',   statut: 'À planifier', libelle: "Affichage des jalons dans le diagramme de Gantt", description: "Intégrer les jalons de projet (JalonProjet) dans la vue Gantt comme marqueurs de point-dans-le-temps distincts des barres de tâches, avec indicateur de statut coloré." },
    ],
  },

  // ── Phase 4 : 29 mars → 11 avril 2026 (2 semaines) ──────────────────────
  {
    libelle: "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: Phase 4 - v2",
    description:
      "Évolutions majeures de la plateforme vers la version 2 : notifications email, pièces jointes, sous-tâches hiérarchiques avancées, vue calendrier, rapports avancés, gestion budgétaire, dashboard personnalisable, PWA, API Swagger et multi-organisations.",
    statut: 'En démarrage',
    dateDebutPrevisionnelle: d(2026, 3, 29),
    dateFinPrevisionnelle:   d(2026, 4, 11),
    dateDebutEffective:      null,
    dateFinEffective:        null,
    taches: [
      { ordre: 1,  priorite: 'Normal', statut: 'À planifier', libelle: "Notifications par email (assignation, rappels d'échéance)", description: "Envoi d'emails transactionnels via SMTP/SendGrid : notification d'assignation à une tâche, rappel J-1 avant échéance. Configuration des préférences par utilisateur." },
      { ordre: 2,  priorite: 'Normal', statut: 'À planifier', libelle: "Pièces jointes sur tâches et commentaires", description: "Upload de fichiers associés aux tâches et commentaires. Stockage S3/R2 ou équivalent. Modèle PieceJointe avec tacheId ou commentaireId, taille, type MIME, URL." },
      { ordre: 3,  priorite: 'Normal', statut: 'À planifier', libelle: "Sous-tâches hiérarchiques V2 (tâches enfants complètes)", description: "Extension au-delà des checklists : sous-tâches avec leur propre assignation, priorité, dates, statut Kanban et intégration dans le Gantt. Profondeur 1 niveau." },
      { ordre: 4,  priorite: 'Normal', statut: 'À planifier', libelle: "Vue calendrier des tâches et jalons", description: "Vue calendrier mensuelle/hebdomadaire affichant les tâches (par date d'échéance) et les jalons. Navigation temporelle, drag-and-drop pour modifier les dates." },
      { ordre: 5,  priorite: 'Normal', statut: 'À planifier', libelle: "Rapports avancés (burndown, vélocité, taux de complétion)", description: "Section Rapports avec graphiques : burndown chart, vélocité de l'équipe, taux de complétion par période. Export CSV des données." },
      { ordre: 6,  priorite: 'Normal', statut: 'À planifier', libelle: "Gestion budgétaire des projets", description: "Champs budget alloué et budget consommé sur les projets. Possibilité de ventiler le budget par tâche ou phase. Indicateurs d'écart budgétaire dans le tableau de bord." },
      { ordre: 7,  priorite: 'Normal', statut: 'À planifier', libelle: "Dashboard personnalisable (widgets drag-and-drop)", description: "Permettre à chaque utilisateur de personnaliser son tableau de bord en ajoutant, supprimant et réorganisant des widgets (mes tâches, projets actifs, indicateurs, etc.)." },
      { ordre: 8,  priorite: 'Normal', statut: 'À planifier', libelle: "PWA / expérience mobile optimisée", description: "Transformer la plateforme en Progressive Web App : manifest, service worker, expérience hors-ligne basique, icônes, écran de démarrage. Interface responsive mobile-first." },
      { ordre: 9,  priorite: 'Normal', statut: 'À planifier', libelle: "Documentation API Swagger / OpenAPI", description: "Génération automatique de la documentation OpenAPI à partir des routes Next.js. Interface Swagger UI accessible à /api/docs pour les développeurs." },
      { ordre: 10, priorite: 'Normal', statut: 'À planifier', libelle: "Support multi-organisations (tenants)", description: "Isolation des données par organisation : modèle Organisation, clé étrangère sur toutes les entités, sous-domaine ou path-based routing par tenant." },
    ],
  },
];

// ─── Script principal ─────────────────────────────────────────────────────────

async function main() {
  const NOW = Date.now();
  console.log('🌱 Démarrage du seed des projets PAPE-D...\n');

  // Trouver un chef de projet
  let chefProjet = await prisma.personneRessource.findFirst({
    where: { estChefProjet: true },
    orderBy: { dateCreation: 'asc' },
  });
  if (!chefProjet) {
    chefProjet = await prisma.personneRessource.findFirst({ orderBy: { dateCreation: 'asc' } });
  }
  if (!chefProjet) {
    console.error("❌ Aucune personne ressource trouvée. Créez-en une d'abord.");
    process.exit(1);
  }
  console.log(`👤 Chef de projet : ${chefProjet.prenoms} ${chefProjet.nom}\n`);

  for (const projetData of PROJETS) {
    const { taches: tachesBase, ...projetFields } = projetData;

    // ── Affecter des dates aléatoires aux tâches ────────────────────────────
    const tachesAvecDates = assignTaskDates(
      tachesBase,
      projetFields.dateDebutPrevisionnelle,
      projetFields.dateFinPrevisionnelle,
    );

    // ── Calculer les métriques projet ───────────────────────────────────────
    const avancReel   = computeTauxAvancementReel(tachesAvecDates);
    const avancAtt    = computeTauxAvancementAttendu(tachesAvecDates, NOW);
    const achevReel   = computeTauxAchevementReel(tachesAvecDates);
    const achevAtt    = computeTauxAchevementAttendu(tachesAvecDates, NOW);
    const etatProjet  = computeEtatAvancementProjet(projetFields, avancReel, avancAtt, NOW);

    // ── Upsert projet ───────────────────────────────────────────────────────
    const existant = await prisma.projet.findUnique({ where: { libelle: projetFields.libelle } });
    let projetId;

    const projetData2 = {
      ...projetFields,
      chefProjetId:          chefProjet.id,
      etatAvancement:        etatProjet,
      tauxAvancementReel:    avancReel,
      tauxAvancementAttendu: avancAtt,
      tauxAchevementReel:    achevReel,
      tauxAchevementAttendu: achevAtt,
    };

    if (existant) {
      await prisma.projet.update({ where: { libelle: projetFields.libelle }, data: projetData2 });
      projetId = existant.id;
      console.log(`🔄 Projet mis à jour : "${projetFields.libelle.slice(0, 65)}..."`);
    } else {
      const created = await prisma.projet.create({ data: projetData2 });
      projetId = created.id;
      console.log(`✅ Projet créé      : "${projetFields.libelle.slice(0, 65)}..."`);
    }

    // ── Upsert tâches ───────────────────────────────────────────────────────
    let tachesUpserted = 0;
    for (const tache of tachesAvecDates) {
      const progression   = getTaskProgression(tache.statut);
      const poidsPriorite = getPriorityWeight(tache.priorite);
      const etatTache     = computeTaskEtatAvancement(tache, NOW);

      const tacheData = {
        projetId,
        libelle:                 tache.libelle,
        description:             tache.description ?? null,
        priorite:                tache.priorite,
        statut:                  tache.statut,
        ordre:                   tache.ordre ?? 0,
        dateDebutPrevisionnelle: tache.dateDebutPrevisionnelle,
        dateFinPrevisionnelle:   tache.dateFinPrevisionnelle,
        dateDebutEffective:      tache.dateDebutEffective,
        dateFinEffective:        tache.dateFinEffective,
        progression,
        poidsPriorite,
        etatAvancement:          etatTache,
      };

      const existingTache = await prisma.tache.findFirst({
        where: { projetId, libelle: tache.libelle },
      });

      if (existingTache) {
        await prisma.tache.update({ where: { id: existingTache.id }, data: tacheData });
      } else {
        await prisma.tache.create({ data: tacheData });
      }
      tachesUpserted++;
    }
    console.log(`   └─ ${tachesUpserted} tâche(s) traitée(s)`);

    // ── Upsert risques ──────────────────────────────────────────────────────
    const risks = computeRiskScores(tachesAvecDates, NOW);
    const riskEntries = [
      { libelle: 'retard',      taux: risks.retard },
      { libelle: 'horsDelai',   taux: risks.horsDelai },
      { libelle: 'progression', taux: risks.progression },
      { libelle: 'suspendu',    taux: risks.suspendu },
      { libelle: 'global',      taux: risks.global },
    ];
    for (const entry of riskEntries) {
      await prisma.risqueProjet.upsert({
        where:  { projetId_libelle: { projetId, libelle: entry.libelle } },
        update: { taux: entry.taux, gravite: getRiskLevel(entry.taux), couleur: getRiskColor(entry.taux) },
        create: { projetId, libelle: entry.libelle, taux: entry.taux, gravite: getRiskLevel(entry.taux), couleur: getRiskColor(entry.taux) },
      });
    }

    console.log(
      `   └─ Métriques : avancement réel=${avancReel}% attendu=${avancAtt}% | ` +
      `achèvement réel=${achevReel}% attendu=${achevAtt}% | ` +
      `état=${etatProjet} | risque global=${risks.global}% (${getRiskLevel(risks.global)})\n`,
    );
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed terminé.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
