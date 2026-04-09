# Cahier des Charges — Évolutions Plateforme PAPE-D Project Tracker

> **Document de référence** — à consulter à chaque étape d'exécution.
> Dernière mise à jour : 2026-03-26
> Statut global : 🔵 Planifié

---

## Table des matières

1. [Contexte et état actuel](#1-contexte-et-état-actuel)
2. [Objectifs des évolutions](#2-objectifs-des-évolutions)
3. [Phase 1 — Hiérarchie des entités + Rattachement Projet](#phase-1--hiérarchie-des-entités--rattachement-projet)
4. [Phase 2 — Module Opérations (modèle de données)](#phase-2--module-opérations--modèle-de-données)
5. [Phase 3 — Module Opérations (interfaces et fonctionnalités)](#phase-3--module-opérations--interfaces-et-fonctionnalités)
6. [Phase 4 — Dashboard unifié Projets + Opérations](#phase-4--dashboard-unifié-projets--opérations)
7. [Règles transversales](#7-règles-transversales)
8. [Récapitulatif du planning](#8-récapitulatif-du-planning)

---

## 1. Contexte et état actuel

### 1.1 Modèle de données existant (à ne pas casser)

| Modèle | Rôle | Observations |
|---|---|---|
| `Projet` | Projet temporaire avec chef, équipe, tâches, risques | Pas de lien vers une Entite |
| `Entite` | Unité organisationnelle (direction, service...) | **Plate — pas de hiérarchie parent/enfant** |
| `PersonneRessource` | Personne rattachée à une Entite | Lien vers Entite existant |
| `CompteAcces` | Compte utilisateur avec permissions | OK |
| `PermissionPageAction` | Permissions par page et action | OK |
| `SessionAuth` | Sessions d'authentification | OK |
| `PartiePrenante` | Partie prenante avec entité et responsable | Lien Entite + PersonneRessource |
| `PartiePrenanteProjets` | Liaison Projet ↔ PartiePrenante | OK |
| `Tache` | Tâche d'un projet | Pas de lien vers Entite |
| `CommentaireTache` | Commentaires threaded sur une tâche | OK |
| `RisqueProjet` | Risques d'un projet | OK |
| `ActiviteTache` | Journal d'activité sur les tâches | OK |
| `TachePerodique` | **Tâche récurrente — déjà existante mais basique** | Pas d'occurrences, pas de lien Projet |
| `HistoriqueModification` | Historique global des modifications | OK |

### 1.2 Problèmes identifiés

1. **`Entite` est plate** : impossible de modéliser une hiérarchie organisationnelle (Direction > Service > Section)
2. **`Projet` n'est pas rattaché à une Entite** : on ne sait pas quelle direction porte quel projet
3. **`TachePerodique` est un squelette** : pas d'occurrences générées, pas de suivi d'exécution, pas de lien projet
4. **Pas de distinction claire Projet vs Opération** dans la navigation et les dashboards

### 1.3 Ce qui NE sera PAS modifié

- La structure des modèles `Projet`, `Tache`, `CompteAcces`, `PermissionPageAction`, `SessionAuth`
- Les routes API existantes (on ajoute, on ne modifie pas)
- La logique de permissions actuelle
- Le modèle `TachePerodique` sera **étendu**, pas remplacé (migration additive)

---

## 2. Objectifs des évolutions

### Objectif 1 — Hiérarchie organisationnelle
Permettre à chaque organisation d'enregistrer son organigramme (arbre auto-référencé sur `Entite`) et de rattacher projets et opérations à une unité de l'organigramme.

### Objectif 2 — Module Opérations complet
Remplacer `TachePerodique` par un module complet :
- **Opération** : container permanent groupant des tâches récurrentes
- **TacheOperationnelle** : définition d'une tâche récurrente avec fréquence
- **OccurrenceTache** : chaque instance générée, à exécuter et tracer

### Objectif 3 — Dashboard unifié
Permettre à un manager de voir la charge réelle d'un collaborateur : projets + opérations, dans une vue consolidée.

---

## Phase 1 — Hiérarchie des entités + Rattachement Projet

> **Période :** 2026-03-27 → 2026-04-09 (2 semaines)
> **Statut :** 🔵 Planifié

### 1.A Évolution du modèle `Entite`

#### Champs à ajouter

```prisma
model Entite {
  // ... champs existants conservés intégralement ...

  typeEntite   String?   // "Direction", "Département", "Service", "Section", "Programme", etc. (label libre)
  parentId     String?   // null = racine de l'organigramme
  parent       Entite?   @relation("HierarchieEntite", fields: [parentId], references: [id], onDelete: SetNull)
  enfants      Entite[]  @relation("HierarchieEntite")
}
```

#### Règles métier

- `parentId = null` → unité racine (sommet de l'organigramme)
- Pas de contrainte sur la profondeur (arbre libre)
- `typeEntite` est un label libre : l'organisation nomme ses niveaux comme elle veut
- Interdire la création d'une référence circulaire (A parent de B, B parent de A)
- Supprimer un nœud : proposer de rattacher les enfants au parent du nœud supprimé (pas de suppression en cascade des enfants)

#### Migration

```sql
-- Migration additive, aucun champ existant modifié
ALTER TABLE entites ADD COLUMN type_entite TEXT;
ALTER TABLE entites ADD COLUMN parent_id TEXT REFERENCES entites(id) ON DELETE SET NULL;
```

---

### 1.B Rattachement `Projet` → `Entite`

#### Champ à ajouter sur `Projet`

```prisma
model Projet {
  // ... champs existants conservés intégralement ...

  entiteId   String?   // optionnel : une Entite peut porter ce projet
  entite     Entite?   @relation(fields: [entiteId], references: [id], onDelete: SetNull)
}
```

#### Règles métier

- Le rattachement est **optionnel** : les projets existants ne sont pas bloqués
- Un projet peut être rattaché à n'importe quel nœud de l'organigramme (pas forcément une feuille)
- Depuis la fiche d'une Entite, afficher la liste des projets qui lui sont rattachés

#### Migration

```sql
ALTER TABLE projets ADD COLUMN entite_id TEXT REFERENCES entites(id) ON DELETE SET NULL;
```

---

### 1.C Interface — Gestion de l'organigramme

#### Page : `/entites` (existante — à enrichir)

- Ajouter une vue **arbre hiérarchique** (toggle entre vue liste plate actuelle et vue arbre)
- Dans le formulaire de création/édition d'une Entite : ajouter les champs `typeEntite` et `parentId` (select de l'entité parente)
- Afficher le chemin hiérarchique : ex. `Ministère > Direction Technique > Service Infrastructure`

#### Page : `/projets/[id]` (existante — à enrichir)

- Ajouter un champ "Entité porteuse" (select de l'organigramme) dans le formulaire projet
- Afficher le rattachement dans la fiche projet

#### API à créer

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/entites/arbre` | Retourne l'arbre complet (structure récursive) |
| `GET` | `/api/entites/[id]/enfants` | Retourne les enfants directs d'une entité |
| `GET` | `/api/entites/[id]/projets` | Retourne les projets rattachés à cette entité |
| `PATCH` | `/api/entites/[id]` | Ajouter `typeEntite` et `parentId` aux champs modifiables |

#### Livrables Phase 1

- [x] Migration Prisma : `typeEntite` + `parentId` sur `Entite`
- [x] Migration Prisma : `entiteId` sur `Projet`
- [x] API `GET /api/entites/arbre`
- [x] API `GET /api/entites/[id]/enfants`
- [x] API `GET /api/entites/[id]/projets`
- [x] Mise à jour API `PUT /api/entites/[id]` et `POST /api/entites`
- [x] Vue arbre sur la page `/entites` (toggle liste / organigramme)
- [x] Champ "Entité porteuse" sur le formulaire création projet
- [x] Champ "Entité porteuse" dans le formulaire d'édition de la fiche projet
- [x] Affichage de l'entité porteuse dans l'en-tête de la fiche projet

---

## Phase 2 — Module Opérations (modèle de données)

> **Période :** 2026-04-10 → 2026-04-30 (3 semaines)
> **Statut :** 🔵 Planifié

### Pourquoi un Module Opérations séparé du Module Projets

| Dimension | Projet | Opération |
|---|---|---|
| Durée | Temporaire, a une fin | Permanente, sans fin prévue |
| Objectif | Produire un livrable | Maintenir un fonctionnement |
| Pilotage | % avancement, jalons | Taux d'exécution, régularité |
| Budget | Alloué une fois | Récurrent (annuel) |
| Fin | Clôture formelle | Archivage uniquement |

### 2.A Modèle `Operation`

> Container permanent groupant les tâches opérationnelles d'une entité

```prisma
model Operation {
  id              String    @id @default(cuid())
  libelle         String
  description     String?
  statut          String    @default("Active")   // "Active" | "Suspendue" | "Archivée"
  entiteId        String?   // Entité responsable de l'opération
  responsableId   String?   // Point focal (PersonneRessource)
  projetSourceId  String?   // Projet qui a induit cette opération (optionnel)
  dateDebut       DateTime
  dateFin         DateTime? // null = permanente

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  entite         Entite?            @relation(fields: [entiteId], references: [id], onDelete: SetNull)
  responsable    PersonneRessource? @relation(fields: [responsableId], references: [id], onDelete: SetNull)
  projetSource   Projet?            @relation(fields: [projetSourceId], references: [id], onDelete: SetNull)
  taches         TacheOperationnelle[]

  @@map("operations")
}
```

#### Statuts de l'opération

- `Active` : génération normale des occurrences
- `Suspendue` : génération gelée, historique conservé
- `Archivée` : plus affichée dans les vues actives, historique accessible

---

### 2.B Modèle `TacheOperationnelle`

> Définition d'une tâche récurrente (modèle/template)

```prisma
model TacheOperationnelle {
  id               String    @id @default(cuid())
  operationId      String
  libelle          String
  description      String?
  periodicite      String    // "QUOTIDIENNE" | "HEBDOMADAIRE" | "MENSUELLE" | "TRIMESTRIELLE" | "SEMESTRIELLE" | "ANNUELLE" | "AD_HOC"
  configPeriodicite String?  // JSON : { "jourDuMois": 1, "jourDeLaSemaine": "LUNDI" } selon la périodicité
  delaiExecution   Int       @default(3)   // nb de jours pour exécuter l'occurrence après déclenchement
  priorite         String    @default("Normale")  // "Critique" | "Haute" | "Normale" | "Basse"
  responsableId    String?   // PersonneRessource exécutante par défaut
  entiteId         String?   // Entité exécutante (peut différer de l'Opération parente)
  estActif         Boolean   @default(true)
  dateDebut        DateTime  // date de début de génération des occurrences
  dateFin          DateTime? // date d'arrêt de génération (null = indéfini)

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  operation    Operation          @relation(fields: [operationId], references: [id], onDelete: Cascade)
  responsable  PersonneRessource? @relation(fields: [responsableId], references: [id], onDelete: SetNull)
  entite       Entite?            @relation(fields: [entiteId], references: [id], onDelete: SetNull)
  occurrences  OccurrenceTache[]

  @@map("taches_operationnelles")
}
```

#### Exemples de `configPeriodicite`

```json
// Mensuelle le 1er du mois
{ "jourDuMois": 1 }

// Hebdomadaire le lundi
{ "jourDeLaSemaine": "LUNDI" }

// Trimestrielle : 1er jour du trimestre
{ "debutTrimestre": true }

// Annuelle : date fixe
{ "mois": 1, "jour": 15 }
```

---

### 2.C Modèle `OccurrenceTache`

> Chaque instance concrète d'une tâche opérationnelle (générée automatiquement)

```prisma
model OccurrenceTache {
  id                  String    @id @default(cuid())
  tacheOperationnelleId String
  datePrevue          DateTime  // date de déclenchement calculée
  dateEcheance        DateTime  // datePrevue + delaiExecution
  dateRealisation     DateTime? // remplie à la clôture
  statut              String    @default("En attente")  // voir valeurs ci-dessous
  realiseParId        String?   // peut différer du responsable par défaut
  commentaire         String?
  retardJours         Int?      // calculé = dateRealisation - dateEcheance (si > 0)

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  tacheOperationnelle TacheOperationnelle @relation(fields: [tacheOperationnelleId], references: [id], onDelete: Cascade)
  realisePar          PersonneRessource?  @relation(fields: [realiseParId], references: [id], onDelete: SetNull)
  commentaires        CommentaireOccurrence[]

  @@map("occurrences_taches")
}
```

#### Statuts d'une occurrence

| Statut | Description |
|---|---|
| `En attente` | Générée, pas encore échue |
| `En cours` | Prise en charge par le responsable |
| `Réalisée` | Clôturée dans les délais |
| `En retard` | Date d'échéance dépassée, non clôturée |
| `Réalisée en retard` | Clôturée après la date d'échéance |
| `Annulée` | Annulée manuellement (avec motif) |

---

### 2.D Modèle `CommentaireOccurrence`

> Commentaires sur une occurrence (même structure que CommentaireTache)

```prisma
model CommentaireOccurrence {
  id            String   @id @default(cuid())
  occurrenceId  String
  compteAccesId String
  contenu       String
  dateCreation  DateTime @default(now())
  parentId      String?

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  occurrence  OccurrenceTache           @relation(fields: [occurrenceId], references: [id], onDelete: Cascade)
  compteAcces CompteAcces               @relation(fields: [compteAccesId], references: [id], onDelete: Cascade)
  parent      CommentaireOccurrence?    @relation("RepliesOccurrence", fields: [parentId], references: [id], onDelete: SetNull)
  reponses    CommentaireOccurrence[]   @relation("RepliesOccurrence")

  @@map("commentaires_occurrences")
}
```

---

### 2.E Migration de `TachePerodique` (existante)

`TachePerodique` existe mais est un squelette sans occurrences.

**Stratégie :** Migration des données existantes vers le nouveau modèle, puis `TachePerodique` devient dépréciée.

1. Pour chaque `TachePerodique` existante, créer une `Operation` de migration automatiquement
2. Créer la `TacheOperationnelle` correspondante
3. Garder `TachePerodique` en base le temps de valider la migration (ne pas supprimer immédiatement)
4. Après validation : archiver `TachePerodique` (hors scope de cette phase)

---

### 2.F Lien Projet → Operation (traçabilité)

Le champ `projetSourceId` sur `Operation` crée la traçabilité :

```
Projet "Déploiement SIH" (clôturé)
  └──► génère ──►  Operation "Maintenance SIH"
                      └── TacheOperationnelle : Sauvegarde quotidienne
                      └── TacheOperationnelle : Rapport mensuel DSSI
                      └── TacheOperationnelle : Mise à jour annuelle licences
```

Depuis la fiche d'un projet clôturé, un bouton **"Créer une opération induite"** pré-remplit l'opération avec le projet source.

---

### 2.G API à créer — Module Opérations

#### Opérations

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/operations` | Liste des opérations (filtres: statut, entiteId, responsableId) |
| `POST` | `/api/operations` | Créer une opération |
| `GET` | `/api/operations/[id]` | Détail d'une opération avec ses tâches |
| `PATCH` | `/api/operations/[id]` | Modifier une opération |
| `DELETE` | `/api/operations/[id]` | Archiver (soft delete) |

#### Tâches opérationnelles

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/operations/[id]/taches` | Liste des tâches d'une opération |
| `POST` | `/api/operations/[id]/taches` | Créer une tâche opérationnelle |
| `PATCH` | `/api/taches-operationnelles/[id]` | Modifier une tâche |
| `DELETE` | `/api/taches-operationnelles/[id]` | Désactiver une tâche |

#### Occurrences

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/occurrences` | Liste des occurrences (filtres: statut, responsableId, période) |
| `GET` | `/api/taches-operationnelles/[id]/occurrences` | Occurrences d'une tâche |
| `PATCH` | `/api/occurrences/[id]` | Mettre à jour le statut d'une occurrence |
| `POST` | `/api/occurrences/[id]/commentaires` | Ajouter un commentaire |

#### Cron — Génération automatique des occurrences

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/cron/generer-occurrences` | Générer les occurrences des 30 prochains jours (exécuté quotidiennement) |

#### Règles de génération (cron)

- Exécuté chaque jour à 00:00
- Pour chaque `TacheOperationnelle` active :
  - Calculer la prochaine date selon `periodicite` + `configPeriodicite`
  - Si aucune occurrence `En attente` n'existe pour cette date → créer l'occurrence
  - Générer jusqu'à J+30 à l'avance
- Marquer automatiquement `En retard` toute occurrence dont `dateEcheance < now()` et `statut = "En attente" | "En cours"`

---

### Livrables Phase 2

- [ ] Migration Prisma : modèles `Operation`, `TacheOperationnelle`, `OccurrenceTache`, `CommentaireOccurrence`
- [ ] Migration Prisma : lien `Projet.projetSourceId` (inverse sur `Operation`)
- [ ] Script de migration des données `TachePerodique` → `Operation` + `TacheOperationnelle`
- [ ] API CRUD `Operation`
- [ ] API CRUD `TacheOperationnelle`
- [ ] API CRUD `OccurrenceTache` (statut, commentaires)
- [ ] Route cron `/api/cron/generer-occurrences`
- [ ] Logique de calcul de la prochaine occurrence selon périodicité

---

## Phase 3 — Module Opérations (interfaces et fonctionnalités)

> **Période :** 2026-05-01 → 2026-05-28 (4 semaines)
> **Statut :** 🔵 Planifié

### 3.A Structure de navigation

```
/operations                          ← liste des opérations
/operations/nouvelle                 ← créer une opération
/operations/[id]                     ← fiche opération (tâches + stats)
/operations/[id]/taches/nouvelle     ← créer une tâche opérationnelle
/occurrences                         ← vue calendrier/liste des occurrences à venir
/occurrences/[id]                    ← détail d'une occurrence
```

---

### 3.B Page `/operations` — Liste des opérations

#### Contenu

- Tableau avec colonnes : Libellé, Entité, Responsable, Statut, Nb tâches, Taux d'exécution (30 derniers jours)
- Filtres : Statut (`Active` / `Suspendue` / `Archivée`), Entité, Responsable
- Bouton "Nouvelle opération"
- Indicateurs en haut : Nb opérations actives | Occurrences en retard | Occurrences à faire cette semaine

---

### 3.C Page `/operations/[id]` — Fiche opération

#### Bloc en-tête

- Libellé, Description, Statut (badge coloré)
- Entité responsable + chemin hiérarchique
- Point focal (responsable)
- Projet source (si lié) avec lien vers la fiche projet
- Actions : Modifier | Suspendre/Réactiver | Archiver

#### Bloc statistiques

- Taux d'exécution global (% occurrences réalisées dans les délais / total clôturées)
- Occurrences en retard en cours
- Prochaine occurrence à venir

#### Onglet "Tâches récurrentes"

- Liste des `TacheOperationnelle` avec : libellé, périodicité, responsable, statut actif/inactif
- Bouton "Ajouter une tâche"
- Actions par tâche : Modifier | Désactiver | Voir les occurrences

#### Onglet "Occurrences récentes"

- Liste des 30 dernières occurrences (toutes tâches confondues)
- Colonnes : Tâche, Date prévue, Date échéance, Statut, Réalisé par, Retard (jours)
- Filtre par statut

---

### 3.D Page `/occurrences` — Vue calendrier/planning

#### Vue principale : Calendrier mensuel

- Affiche toutes les occurrences du mois
- Code couleur : Vert (réalisée) | Orange (en cours) | Rouge (en retard) | Gris (en attente)
- Clic sur une occurrence → panneau latéral de détail

#### Vue alternative : Liste

- Triée par date d'échéance croissante
- Filtres : Responsable, Entité, Opération, Statut, Période

#### Mes occurrences (vue personnelle)

- Occurrences dont l'utilisateur connecté est responsable
- Séparées en : "À faire aujourd'hui", "Cette semaine", "En retard", "À venir"

---

### 3.E Page `/occurrences/[id]` — Détail d'une occurrence

- Tâche parente + Opération parente
- Statut actuel avec boutons d'action :
  - `En attente` → [Prendre en charge] → passe à `En cours`
  - `En cours` → [Marquer réalisée] → saisir date de réalisation + commentaire
  - Tout statut → [Annuler] avec motif obligatoire
- Historique des commentaires (avec réponses)
- Indicateur de retard si applicable

---

### 3.F Formulaire de création d'une `TacheOperationnelle`

Champs :
- **Libellé** (obligatoire)
- **Description**
- **Périodicité** (select) : Quotidienne | Hebdomadaire | Mensuelle | Trimestrielle | Semestrielle | Annuelle | Ad hoc
- **Configuration** (dynamique selon périodicité) :
  - Hebdomadaire → sélection du jour de la semaine
  - Mensuelle → sélection du jour du mois (1-28)
  - Trimestrielle → début ou fin de trimestre
  - Annuelle → sélection du mois + jour
- **Délai d'exécution** (nb de jours)
- **Priorité**
- **Responsable** (select PersonneRessource)
- **Entité exécutante** (optionnel, si différente de l'opération)
- **Date de début de génération**
- **Date de fin** (optionnel)

---

### 3.G Notifications

#### Notifications in-app (à implémenter dans cette phase)

| Événement | Destinataire | Message |
|---|---|---|
| Occurrence créée (J-3 avant échéance) | Responsable | "Une occurrence de [Tâche] est à réaliser avant le [date]" |
| Occurrence passée en retard | Responsable | "L'occurrence [Tâche] du [date] est en retard" |
| Occurrence en retard depuis 3 jours | Responsable + Chef entité | "L'occurrence [Tâche] est en retard de 3 jours — escalade" |

#### Notifications email (phase ultérieure, hors scope)

---

### Livrables Phase 3

- [ ] Page `/operations` avec liste et filtres
- [ ] Page `/operations/[id]` avec onglets Tâches / Occurrences
- [ ] Formulaire création/édition Opération
- [ ] Formulaire création/édition TacheOperationnelle (avec config dynamique périodicité)
- [ ] Page `/occurrences` vue calendrier
- [ ] Page `/occurrences` vue liste
- [ ] Page `/occurrences/[id]` avec workflow de statuts
- [ ] Vue "Mes occurrences" (filtré sur l'utilisateur connecté)
- [ ] Système de notifications in-app pour les occurrences
- [ ] Bouton "Créer une opération induite" sur la fiche projet (clôturé)
- [ ] Mise à jour des permissions (`PermissionPageAction`) pour les nouvelles pages

---

## Phase 4 — Dashboard unifié Projets + Opérations

> **Période :** 2026-05-29 → 2026-06-11 (2 semaines)
> **Statut :** 🔵 Planifié

### Objectif

Donner à chaque acteur une vision consolidée de sa charge de travail, qu'elle vienne de projets ou d'opérations.

---

### 4.A Vue "Ma charge" (utilisateur connecté)

#### Section Projets

- Tâches de projets assignées (filtres : statut, projet, priorité)
- Tâches en retard
- Tâches dont l'échéance est dans les 7 prochains jours

#### Section Opérations

- Occurrences à réaliser (en attente ou en cours)
- Occurrences en retard
- Occurrences des 7 prochains jours

#### Vue consolidée

- Timeline hebdomadaire mélangeant tâches projets + occurrences opérationnelles
- Indicateur de charge : nb d'éléments par jour de la semaine

---

### 4.B Vue manager — Charge de l'équipe

#### Filtres

- Entité (avec héritage hiérarchique : voir la charge de toute la sous-arborescence)
- Personne spécifique
- Période

#### Contenu

- Tableau : Personne | Tâches projet en cours | Occurrences op. en cours | Retards | Charge prévue J+7
- Clic sur une personne → détail de sa charge (tâches + occurrences)

---

### 4.C Indicateurs globaux (page d'accueil)

Enrichissement de la page d'accueil existante avec :

| Indicateur | Source |
|---|---|
| Projets actifs | Module Projets |
| Tâches en retard (projets) | Module Projets |
| Opérations actives | Module Opérations |
| Occurrences en retard | Module Opérations |
| Occurrences à venir cette semaine | Module Opérations |
| Taux d'exécution moyen (opérations, 30j) | Module Opérations |

---

### 4.D API à créer — Dashboard

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/dashboard/ma-charge` | Charge consolidée de l'utilisateur connecté |
| `GET` | `/api/dashboard/charge-equipe` | Charge de l'équipe (filtré par entité) |
| `GET` | `/api/dashboard/indicateurs` | Indicateurs globaux de la page d'accueil |

---

### Livrables Phase 4

- [ ] API `/api/dashboard/ma-charge`
- [ ] API `/api/dashboard/charge-equipe`
- [ ] API `/api/dashboard/indicateurs`
- [ ] Composant "Ma charge" (projets + opérations)
- [ ] Vue timeline hebdomadaire consolidée
- [ ] Vue manager "Charge de l'équipe"
- [ ] Mise à jour de la page d'accueil avec les nouveaux indicateurs

---

## 7. Règles transversales

### 7.1 Principe d'évolution additive

> Toute modification de la base de données se fait par **ajout de colonnes ou de tables**. Aucune colonne existante ne sera supprimée ou renommée dans le cadre de ces évolutions.

### 7.2 Compatibilité descendante des API

> Les routes API existantes ne changent pas de contrat. On peut ajouter des champs dans les réponses (non-breaking), jamais en supprimer.

### 7.3 Champs optionnels par défaut

> Tous les nouveaux liens entre entités existantes (`entiteId` sur `Projet`, `projetSourceId` sur `Operation`) sont **optionnels** (`String?`). Les enregistrements existants ne sont pas bloqués.

### 7.4 Permissions

> Chaque nouvelle page du module Opérations devra avoir ses `PermissionPageAction` correspondantes créées dans le seed et dans le script d'initialisation des comptes.

### 7.5 Conventions de code

> Respecter les conventions existantes :
> - Nommage des modèles Prisma en PascalCase français
> - `@@map` en snake_case
> - Champs d'audit (`creePar`, `creeLe`, `modifiePar`, `modifieLe`) sur tous les modèles
> - Routes API sous `/api/` avec gestion d'erreur standardisée

---

## 8. Récapitulatif du planning

| Phase | Contenu | Début | Fin | Durée | Statut |
|---|---|---|---|---|---|
| **Phase 1** | Hiérarchie Entites + Rattachement Projet | 2026-03-27 | 2026-04-09 | 2 semaines | ✅ Terminé |
| **Phase 2** | Module Opérations — Modèle de données + API | 2026-04-10 | 2026-04-30 | 3 semaines | 🔵 Planifié |
| **Phase 3** | Module Opérations — Interfaces | 2026-05-01 | 2026-05-28 | 4 semaines | 🔵 Planifié |
| **Phase 4** | Dashboard unifié | 2026-05-29 | 2026-06-11 | 2 semaines | 🔵 Planifié |

**Durée totale estimée : 11 semaines**
**Date de livraison finale estimée : 2026-06-11**

---

*Document généré le 2026-03-26 — à mettre à jour au fur et à mesure de l'exécution.*
