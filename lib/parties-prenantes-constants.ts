export const ROLES_PARTIE_PRENANTE = [
  'Maître d\'ouvrage',
  'Maître d\'œuvre',
  'Commanditaire',
  'Sponsor',
  'Validateur',
  'Utilisateur métier',
  'Utilisateur final',
  'Bénéficiaire direct',
  'Bénéficiaire indirect',
  'Partenaire technique',
  'Partenaire financier',
  'Fournisseur',
  'Prestataire',
  'Gouvernance',
  'Régulateur',
  'Observateur',
  'Impacté par le projet',
];

export const NIVEAUX_INFLUENCE_INTERET = ['Faible', 'Moyen', 'Élevé', 'Critique'] as const;

export const TYPE_ACTEUR = {
  ORGANISATIONNEL: 'ORGANISATIONNEL',
  ACTEUR_COLLECTIF: 'ACTEUR_COLLECTIF_NON_ORGANISATIONNEL',
} as const;
