export interface PermissionActionDef {
  key: string;
  label: string;
}

export interface PermissionPageDef {
  key: string;
  label: string;
  actions: PermissionActionDef[];
}

export const PERMISSIONS_CATALOG: PermissionPageDef[] = [
  {
    key: 'tableau-de-bord',
    label: 'Tableau de bord',
    actions: [{ key: 'view', label: 'Consulter' }],
  },
  {
    key: 'projets',
    label: 'Projets',
    actions: [
      { key: 'view', label: 'Consulter' },
      { key: 'create', label: 'Creer' },
      { key: 'update', label: 'Modifier' },
      { key: 'delete', label: 'Supprimer' },
    ],
  },
  {
    key: 'detail-projet',
    label: 'Detail projet',
    actions: [
      { key: 'view', label: 'Consulter' },
      { key: 'manage-backlog', label: 'Gerer backlog' },
      { key: 'manage-execution', label: 'Gerer execution' },
      { key: 'view-gantt', label: 'Voir gantt' },
    ],
  },
  {
    key: 'personnes',
    label: 'Ressources',
    actions: [
      { key: 'view', label: 'Consulter' },
      { key: 'create', label: 'Creer' },
      { key: 'update', label: 'Modifier' },
    ],
  },
  {
    key: 'entites',
    label: 'Entites',
    actions: [
      { key: 'view', label: 'Consulter' },
      { key: 'create', label: 'Creer' },
      { key: 'update', label: 'Modifier' },
    ],
  },
  {
    key: 'comptes-acces',
    label: 'Comptes d\'acces',
    actions: [
      { key: 'view', label: 'Consulter' },
      { key: 'create', label: 'Creer' },
      { key: 'manage-authz', label: 'Gerer autorisations' },
    ],
  },
  {
    key: 'profil',
    label: 'Profil',
    actions: [{ key: 'change-password', label: 'Changer mot de passe' }],
  },
];
