export interface PermActionDef {
  key: string;
  label: string;
}

export interface PermNodeDef {
  label: string;
  pageKey: string;
  actions: PermActionDef[];
  children?: PermNodeDef[];
}

export const PERMISSIONS_CATALOG: PermNodeDef[] = [
  {
    label: 'Tableau de bord',
    pageKey: 'tableau-de-bord',
    actions: [{ key: 'view', label: 'Consulter' }],
  },
  {
    label: 'Projets',
    pageKey: 'projets',
    actions: [
      { key: 'view', label: 'Consulter liste' },
      { key: 'create', label: 'Nouveau projet' },
      { key: 'view-detail', label: 'Consulter détail' },
    ],
    children: [
      {
        label: 'Informations générales',
        pageKey: 'detail-projet',
        actions: [
          { key: 'view', label: 'Consulter' },
          { key: 'delete', label: 'Supprimer projet' },
        ],
        children: [
          {
            label: 'Informations générales du projet',
            pageKey: 'detail-projet',
            actions: [{ key: 'view-info', label: 'Consulter' }],
            children: [
              { label: 'Libellé',            pageKey: 'detail-projet', actions: [{ key: 'view-libelle',    label: 'Consulter' }, { key: 'edit-libelle',    label: 'Modifier' }] },
              { label: 'Description',        pageKey: 'detail-projet', actions: [{ key: 'view-description', label: 'Consulter' }, { key: 'edit-description', label: 'Modifier' }] },
              { label: 'Statut',             pageKey: 'detail-projet', actions: [{ key: 'view-statut',      label: 'Consulter' }, { key: 'edit-statut',      label: 'Modifier' }] },
              { label: 'Chef de projet',     pageKey: 'detail-projet', actions: [{ key: 'view-chef',        label: 'Consulter' }, { key: 'edit-chef',        label: 'Modifier' }] },
              { label: 'Début prévisionnel', pageKey: 'detail-projet', actions: [{ key: 'view-debut-prev',  label: 'Consulter' }, { key: 'edit-debut-prev',  label: 'Modifier' }] },
              { label: 'Fin prévisionnelle', pageKey: 'detail-projet', actions: [{ key: 'view-fin-prev',    label: 'Consulter' }, { key: 'edit-fin-prev',    label: 'Modifier' }] },
              { label: 'Début effectif',     pageKey: 'detail-projet', actions: [{ key: 'view-debut-eff',   label: 'Consulter' }, { key: 'edit-debut-eff',   label: 'Modifier' }] },
              { label: 'Fin effective',      pageKey: 'detail-projet', actions: [{ key: 'view-fin-eff',     label: 'Consulter' }, { key: 'edit-fin-eff',     label: 'Modifier' }] },
            ],
          },
          {
            label: 'Entités impliquées',
            pageKey: 'detail-projet',
            actions: [{ key: 'view-entites', label: 'Consulter' }],
          },
          {
            label: "Membres de l'équipe",
            pageKey: 'detail-projet',
            actions: [
              { key: 'view-equipe',   label: 'Consulter' },
              { key: 'add-equipe',    label: 'Ajouter' },
              { key: 'remove-equipe', label: 'Retirer' },
            ],
          },
          {
            label: 'Registre des parties prenantes',
            pageKey: 'detail-projet',
            actions: [{ key: 'view-pp', label: 'Consulter' }],
          },
        ],
      },
      {
        label: 'Liste des tâches',
        pageKey: 'detail-projet',
        actions: [
          { key: 'view-taches',       label: 'Consulter liste' },
          { key: 'create-tache',      label: 'Nouvelle tâche' },
          { key: 'view-detail-tache', label: 'Consulter détail' },
        ],
      },
      {
        label: 'Exécution',
        pageKey: 'detail-projet',
        actions: [{ key: 'view-exec', label: 'Consulter' }],
        children: [
          { label: 'À faire',    pageKey: 'detail-projet', actions: [{ key: 'move-a-faire',    label: 'Déplacer' }] },
          { label: 'En cours',   pageKey: 'detail-projet', actions: [{ key: 'move-en-cours',   label: 'Déplacer' }] },
          { label: 'Terminé',    pageKey: 'detail-projet', actions: [{ key: 'move-termine',    label: 'Déplacer' }] },
          { label: 'Validé',     pageKey: 'detail-projet', actions: [{ key: 'move-valide',     label: 'Déplacer' }] },
          { label: 'En attente', pageKey: 'detail-projet', actions: [{ key: 'move-en-attente', label: 'Déplacer' }] },
        ],
      },
      {
        label: 'Gantt',
        pageKey: 'detail-projet',
        actions: [{ key: 'view-gantt', label: 'Consulter' }],
      },
      {
        label: 'Détail tâche',
        pageKey: 'detail-projet',
        actions: [{ key: 'view-detail-tache-tab', label: 'Consulter' }],
        children: [
          {
            label: 'Informations de la tâche',
            pageKey: 'detail-projet',
            actions: [
              { key: 'view-tache-info', label: 'Consulter' },
              { key: 'save-tache',      label: 'Enregistrer' },
              { key: 'delete-tache',    label: 'Supprimer' },
            ],
            children: [
              { label: 'Libellé',               pageKey: 'detail-projet', actions: [{ key: 'view-tache-libelle',     label: 'Consulter' }, { key: 'edit-tache-libelle',     label: 'Modifier' }] },
              { label: 'Description',           pageKey: 'detail-projet', actions: [{ key: 'view-tache-description', label: 'Consulter' }, { key: 'edit-tache-description', label: 'Modifier' }] },
              { label: 'Priorité',              pageKey: 'detail-projet', actions: [{ key: 'view-tache-priorite',    label: 'Consulter' }, { key: 'edit-tache-priorite',    label: 'Modifier' }] },
              { label: 'Assignée à',            pageKey: 'detail-projet', actions: [{ key: 'view-tache-assigne',     label: 'Consulter' }, { key: 'edit-tache-assigne',     label: 'Modifier' }] },
              { label: "Statut d'exécution",    pageKey: 'detail-projet', actions: [{ key: 'view-tache-statut-exec', label: 'Consulter' }, { key: 'edit-tache-statut-exec', label: 'Modifier' }] },
              { label: "Statut d'avancement",   pageKey: 'detail-projet', actions: [{ key: 'view-tache-statut-av',   label: 'Consulter' }, { key: 'edit-tache-statut-av',   label: 'Modifier' }] },
              { label: 'Dates prévisionnelles',  pageKey: 'detail-projet', actions: [{ key: 'view-tache-dates-prev',  label: 'Consulter' }, { key: 'edit-tache-dates-prev',  label: 'Modifier' }] },
              { label: 'Dates effectives',      pageKey: 'detail-projet', actions: [{ key: 'view-tache-dates-eff',   label: 'Consulter' }, { key: 'edit-tache-dates-eff',   label: 'Modifier' }] },
            ],
          },
          {
            label: 'Commentaire',
            pageKey: 'detail-projet',
            actions: [
              { key: 'view-comments',   label: 'Consulter' },
              { key: 'add-comment',     label: 'Commenter' },
              { key: 'edit-comment',    label: 'Modifier' },
              { key: 'reply-comment',   label: 'Répondre' },
              { key: 'delete-comment',  label: 'Supprimer' },
            ],
          },
          {
            label: 'Historique',
            pageKey: 'detail-projet',
            actions: [{ key: 'view-historique', label: 'Consulter' }],
          },
        ],
      },
    ],
  },
  {
    label: 'Personne ressource',
    pageKey: 'personnes',
    actions: [
      { key: 'view',   label: 'Consulter' },
      { key: 'create', label: 'Ajouter' },
      { key: 'update', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer' },
    ],
  },
  {
    label: 'Entité',
    pageKey: 'entites',
    actions: [
      { key: 'view',   label: 'Consulter' },
      { key: 'create', label: 'Ajouter' },
      { key: 'update', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer' },
    ],
  },
  {
    label: "Compte d'accès",
    pageKey: 'comptes-acces',
    actions: [
      { key: 'view',            label: 'Consulter' },
      { key: 'create',          label: 'Créer compte' },
      { key: 'change-password', label: 'Modifier mot de passe' },
      { key: 'suspend',         label: 'Suspendre' },
      { key: 'manage-authz',    label: 'Autoriser' },
    ],
  },
  {
    label: 'Profil',
    pageKey: 'profil',
    actions: [
      { key: 'view',            label: 'Consulter' },
      { key: 'edit-info',       label: 'Modifier informations' },
      { key: 'change-password', label: 'Modifier mot de passe' },
    ],
  },
  {
    label: 'Opérations',
    pageKey: 'operations',
    actions: [
      { key: 'view',   label: 'Consulter' },
      { key: 'create', label: 'Créer' },
      { key: 'update', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer / Archiver' },
    ],
  },
  {
    label: 'Occurrences',
    pageKey: 'occurrences',
    actions: [
      { key: 'view',   label: 'Consulter' },
      { key: 'update', label: 'Mettre à jour le statut' },
    ],
  },
];

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Flatten all pageKey:actionKey pairs from the tree */
export function flattenPermissions(nodes: PermNodeDef[]): { pageKey: string; actionKey: string }[] {
  const result: { pageKey: string; actionKey: string }[] = [];
  function walk(node: PermNodeDef) {
    node.actions.forEach(a => result.push({ pageKey: node.pageKey, actionKey: a.key }));
    node.children?.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}
