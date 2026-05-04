# Migration vers la Gestion par Cadre Logique (LogFrame simplifié)

**Statut** : Phase 0 en cours
**Dernière mise à jour** : 2026-04-23
**Document de référence unique** — toute décision liée à cette évolution doit être tracée ici.

> **Boussole de session** : ce document remplace toute mémoire conversationnelle pour cette migration. Une session ouverte sur ce sujet doit le lire en premier et le mettre à jour à chaque jalon franchi (case à cocher en bas du document).

---

## 1. Vision et contexte

### 1.1 Problème
Le tracker actuel suit la logique simple :
```
Projet → Tâche → [Sous-tâche]
```
Cette logique convient à de la gestion de projets opérationnels internes mais **ne suffit pas** pour des projets financés par des bailleurs internationaux (UE, Banque Mondiale, AFD, BAD, UNDP, USAID, etc.) qui exigent un reporting selon le standard **Gestion Axée sur les Résultats (GAR)** / **Cadre Logique (LogFrame)**.

### 1.2 Objectif
Faire évoluer la structure vers :
```
Programme → Projet → Résultat attendu → Activité → [Sous-activité] → Tâche → [Sous-tâche]
```
Tout en :
- Préservant **100 % des données existantes** (zéro perte)
- N'introduisant **aucune régression** sur les fonctionnalités actuelles
- Permettant une **adoption progressive** projet par projet

### 1.3 Hors scope (Phase 1 — pourra être ajouté en Phase 4)
- Indicateurs de performance par niveau (OVI / IOV)
- Sources de vérification (SMV)
- Hypothèses et risques par niveau
- Budget par activité × bailleur (cofinancement)
- Composantes / Axes thématiques au-dessus de Résultat
- Importation depuis Word/Excel des cadres logiques existants

---

## 2. Cadre de référence — Standards bailleurs

| Niveau LogFrame | Terme bailleur (FR) | Terme anglais | Horizon | Exemple |
|---|---|---|---|---|
| Impact | Finalité / Objectif global | Impact / Goal | 5-10 ans | Améliorer la santé maternelle |
| Outcome | Objectif spécifique | Outcome / Purpose | 3-5 ans | Accès aux soins prénatals augmenté de 40% |
| **Output** | **Résultat attendu** | **Output / Result** | **1-3 ans** | **50 centres de santé équipés** |
| **Activity** | **Activité** | **Activity** | **Semaines/mois** | **Formation du personnel soignant** |
| **Task** | **Tâche opérationnelle** | **Task** | **Jours** | **Organiser session de formation le 12/05** |

> Niveaux **Impact** et **Outcome** sont implicites : ils sont reflétés dans les champs `description` du `Programme` et du `Projet` respectivement. Les bailleurs reportent essentiellement aux niveaux **Output / Activity / Task**, qui correspondent à nos modèles `ResultatAttendu / Activite / Tache`.

**Programme** (au-dessus du projet) : regroupement de plusieurs projets partageant une finalité commune et/ou une enveloppe budgétaire (ex: "Programme National de Santé Maternelle 2024-2028").

---

## 3. Hiérarchie retenue (Option B — LogFrame simplifié)

```
Programme
 └─ Projet
     └─ Résultat attendu (Output)
         └─ Activité
             └─ [Sous-activité (auto-relation Activité)]
                 └─ Tâche (existant)
                     └─ [Sous-tâche (existant)]
```

### 3.1 Conventions de codification (héritées des standards bailleurs)
- **Programme** : sigle libre, ex: `PROG-SANTE-2028`
- **Projet** : code libre, ex: `PRJ-001`
- **Résultat** : `R<n>`, ex: `R1`, `R2`
- **Activité** : `A<résultat>.<n>`, ex: `A1.1`, `A1.2`, `A2.1`
- **Sous-activité** : `A<résultat>.<n>.<m>`, ex: `A1.1.1`
- **Tâche** : pas de codification stricte (libellé + id)

### 3.2 Cardinalités

| Relation | Min..Max | Note |
|---|---|---|
| Programme → Projet | 0..N | Programme peut être vide |
| Projet → Programme | 0..1 | Projet peut être hors programme (legacy ou autonome) |
| Projet → Résultat | 0..N | Résultats optionnels (legacy compat) |
| Résultat → Activité | 1..N | Un résultat sans activité = WIP |
| Activité → Sous-activité | 0..N | Profondeur libre via auto-relation |
| Activité → Tâche | 0..N | Une activité peut être trop fine pour avoir des tâches |
| Tâche → Activité | 0..1 | Tâche legacy = directement sur projet (sans activité) |
| Projet → Tâche (legacy) | 0..N | Conservé pour compat |

---

## 4. Modélisation des données

### 4.1 Diagramme conceptuel
```
┌──────────────┐       ┌──────────┐       ┌─────────────────┐
│  Programme   │ 1───N │  Projet  │ 1───N │ ResultatAttendu │
└──────────────┘       └──────────┘       └─────────────────┘
                            │                       │
                            │ 1                     │ 1
                            │                       │
                            │ N (legacy)            │ N
                            ▼                       ▼
                       ┌─────────┐  N───1   ┌──────────┐
                       │  Tache  │◀─────────│ Activite │ ◀─┐
                       └─────────┘   0..1   └──────────┘   │ self-relation
                            │                     │        │ parent/enfants
                            │ 1                   └────────┘
                            │ N
                            ▼
                       ┌──────────┐
                       │ SousTache│
                       └──────────┘
```

### 4.2 Nouveaux modèles Prisma (à ajouter)

```prisma
// ─────────────────────────────────────────────
// MODULE PROGRAMME / CADRE LOGIQUE
// ─────────────────────────────────────────────

model Programme {
  id           String    @id @default(cuid())
  libelle      String    @unique
  code         String?   @unique           // sigle court ex "PROG-SANTE-2028"
  description  String?
  bailleur     String?                     // texte libre ex "UE - FED 11"
  dateDebut    DateTime?
  dateFin      DateTime?
  budgetTotal  Float?
  devise       String    @default("XOF")
  statut       String    @default("Actif") // Actif | Clôturé | Archivé
  entiteId     String?                     // entité pilote du programme

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  entite   Entite?  @relation("ProgrammePilote", fields: [entiteId], references: [id], onDelete: SetNull)
  projets  Projet[]

  @@map("programmes")
}

model ResultatAttendu {
  id          String  @id @default(cuid())
  projetId    String
  code        String                      // "R1", "R2"
  libelle     String
  description String?
  ordre       Int     @default(0)         // pour tri d'affichage

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  projet    Projet     @relation(fields: [projetId], references: [id], onDelete: Cascade)
  activites Activite[]

  @@unique([projetId, code])
  @@map("resultats_attendus")
}

model Activite {
  id               String    @id @default(cuid())
  resultatId       String
  parentActiviteId String?                       // self-relation (sous-activités)
  code             String                        // "A1.1", "A1.1.1"
  libelle          String
  description      String?
  responsableId    String?                       // PersonneRessource
  dateDebutPrev    DateTime?
  dateFinPrev      DateTime?
  dateDebutEff     DateTime?
  dateFinEff       DateTime?
  statut           String    @default("Planifiée") // Planifiée | En cours | Terminée | Annulée | Suspendue
  progression      Int       @default(0)         // 0-100, calculée à partir des tâches
  ordre            Int       @default(0)

  creePar    String?
  creeLe     DateTime?
  modifiePar String?
  modifieLe  DateTime?

  resultat    ResultatAttendu    @relation(fields: [resultatId], references: [id], onDelete: Cascade)
  parent      Activite?          @relation("ActiviteHierarchie", fields: [parentActiviteId], references: [id], onDelete: SetNull)
  enfants     Activite[]         @relation("ActiviteHierarchie")
  responsable PersonneRessource? @relation("ActiviteResponsable", fields: [responsableId], references: [id], onDelete: SetNull)
  taches      Tache[]

  @@unique([resultatId, code])
  @@map("activites")
}
```

### 4.3 Modifications des modèles existants

```prisma
model Projet {
  // ... champs existants INCHANGÉS
  programmeId String?                      // NOUVEAU : null = projet hors programme

  programme Programme?       @relation(fields: [programmeId], references: [id], onDelete: SetNull)
  resultats ResultatAttendu[]              // NOUVEAU
  // ... relations existantes INCHANGÉES (taches, equipeProjet, etc.)
}

model Tache {
  // ... champs existants INCHANGÉS
  activiteId String?                       // NOUVEAU : null = tâche legacy directement sur projet

  activite Activite? @relation(fields: [activiteId], references: [id], onDelete: SetNull)
  // ... relations existantes INCHANGÉES
}

model Entite {
  // ... existant inchangé
  programmesPilotes Programme[] @relation("ProgrammePilote")  // NOUVEAU (back-relation)
}

model PersonneRessource {
  // ... existant inchangé
  activitesResponsables Activite[] @relation("ActiviteResponsable")  // NOUVEAU (back-relation)
}
```

### 4.4 Champs `null` autorisés (compat legacy)

| Champ | Modèle | Pourquoi `null` autorisé |
|---|---|---|
| `programmeId` | Projet | Projet existant n'a pas de programme → reste `null` |
| `activiteId` | Tache | Tâche existante n'a pas d'activité → reste `null` |
| `parentActiviteId` | Activite | Activité racine (pas une sous-activité) |
| `responsableId` | Activite | Pas toujours assignée |
| `entiteId` | Programme | Programme inter-entités possible |

---

## 5. User Stories

### 5.1 Personae

| Persona | Rôle | Besoin principal |
|---|---|---|
| **Bailleur (externe)** | Lit le reporting | Voir les résultats attendus, leur état d'avancement, les activités menées |
| **Coordinateur de programme** | Pilote 1+ programmes | Vue agrégée par programme, alertes retards |
| **Chef de projet** | Pilote 1 projet | Construire le cadre logique, planifier les activités, suivre les tâches |
| **Gestionnaire d'activité** | Mène 1+ activités | Mettre à jour l'état des tâches dont il est responsable |
| **Agent** | Exécute des tâches | Mettre à jour ses tâches assignées |

### 5.2 User Stories prioritaires (P0–P3)

#### Programme
- **US-PG-01** _En tant que coordinateur, je veux créer un programme avec libellé, bailleur, dates, budget, pour regrouper plusieurs projets._
- **US-PG-02** _En tant que coordinateur, je veux rattacher un projet existant à un programme, pour le positionner dans le portefeuille._
- **US-PG-03** _En tant que coordinateur, je veux voir un dashboard programme avec la liste des projets, leur taux d'avancement et budget consommé._

#### Cadre logique
- **US-CL-01** _En tant que chef de projet, je veux créer un résultat attendu (output) pour mon projet, avec code et libellé._
- **US-CL-02** _En tant que chef de projet, je veux ajouter des activités sous un résultat, avec code, libellé, responsable, dates._
- **US-CL-03** _En tant que chef de projet, je veux décomposer une activité en sous-activités quand elle est trop large._
- **US-CL-04** _En tant que chef de projet, je veux visualiser le cadre logique de mon projet sous forme d'arbre déployable._

#### Tâches
- **US-TK-01** _En tant que chef de projet, je veux rattacher une tâche existante à une activité (déplacement)._
- **US-TK-02** _En tant que chef de projet, je veux créer une nouvelle tâche directement sous une activité._
- **US-TK-03** _En tant que chef de projet, je veux voir la liste des tâches d'une activité avec leur statut, pour calculer la progression de l'activité._
- **US-TK-04** _En tant qu'agent, je veux que mes tâches assignées affichent l'activité parente (et le résultat) pour comprendre mon rôle dans le cadre._

#### Compatibilité legacy
- **US-LG-01** _En tant qu'utilisateur d'un projet existant, je veux que mes tâches actuelles restent visibles dans l'onglet "Liste des tâches" même si elles n'ont pas d'activité parente._
- **US-LG-02** _En tant que chef de projet, je veux pouvoir choisir de migrer mes tâches existantes vers le cadre logique progressivement, sans rupture._

---

## 6. Matrice RACI

`R` = Responsable (fait) · `A` = Approbateur (valide, 1 seul) · `C` = Consulté · `I` = Informé

### 6.1 Phase de mise en œuvre (côté équipe technique)

| Tâche | Dev | Chef projet métier | Coordinateur | Bailleur |
|---|:---:|:---:|:---:|:---:|
| Validation du modèle de données | A | C | C | I |
| Implémentation Phase 0 (schema) | R | I | I | — |
| Implémentation Phase 1-2 (UI) | R | C | I | — |
| Tests utilisateurs | C | R/A | C | — |
| Migration des données projet par projet | C | R/A | C | — |
| Recette PROD | C | C | A | I |

### 6.2 Cycle de vie d'un cadre logique (côté usage métier)

| Action | Chef projet | Coordinateur | Gestionnaire d'activité | Agent |
|---|:---:|:---:|:---:|:---:|
| Créer un programme | I | R/A | — | — |
| Rattacher projet à programme | C | R/A | — | — |
| Créer résultat attendu | R/A | C | — | — |
| Créer activité | R | A | C | — |
| Décomposer en sous-activités | R | A | C | — |
| Assigner responsable d'activité | R/A | I | I | — |
| Créer tâche sous activité | R | I | C | — |
| Rattacher tâche existante à activité | R/A | I | C | — |
| Mettre à jour statut/progression activité | C | I | R/A | — |
| Mettre à jour statut tâche | C | — | C | R/A |

---

## 7. Permissions et autorisations

### 7.1 Nouvelles entrées au catalogue de permissions

| pageKey | actionKey | Description |
|---|---|---|
| `programmes` | `read` | Voir la liste des programmes |
| `programmes` | `write` | Créer/modifier/archiver un programme |
| `programmes` | `delete` | Supprimer un programme (rare, soft) |
| `cadre-logique` | `read` | Voir le cadre logique d'un projet |
| `cadre-logique` | `write` | Créer/modifier résultats et activités |
| `cadre-logique` | `delete` | Supprimer résultat ou activité |

### 7.2 Mapping rôles → permissions

| Rôle | programmes:read | programmes:write | programmes:delete | cadre-logique:read | cadre-logique:write | cadre-logique:delete |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **AGENT** | ✓ | ✗ | ✗ | ✓ (projets dont il est membre) | ✗ | ✗ |
| **GESTIONNAIRE** | ✓ | ✗ | ✗ | ✓ | ✓ (activités dont il est responsable) | ✗ |
| **COORDINATEUR** | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **ADMINISTRATEUR** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **super-admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 7.3 Règles spécifiques (à coder dans `lib/require-auth.ts`)

- `canManageProgramme(user, programmeEntiteId?)` → COORDINATEUR+ uniquement
- `canManageResultat(user, projet)` → super-admin OU COORDINATEUR+ OU `isChefProjet(projet)`
- `canManageActivite(user, projet, activiteResponsableId?)` → super-admin OU COORDINATEUR+ OU `isChefProjet(projet)` OU (`hasRole('GESTIONNAIRE')` ET responsable de l'activité)

---

## 8. Stratégie de migration (zéro perte, zéro régression)

### Principe directeur
**Cohabitation** : ajouter sans toucher à l'existant, faire vivre les deux mondes (legacy `Projet→Tache` et nouveau `Projet→Resultat→Activite→Tache`) jusqu'à adoption complète.

### 8.1 Sécurités techniques
1. **`programmeId` et `activiteId` sont nullable** — aucune contrainte rétroactive
2. **`onDelete: SetNull`** sur ces FK — supprimer un programme/activité ne supprime pas projet/tâche
3. **Aucune suppression / réécriture** de données existantes
4. **Migration Prisma additive uniquement** — pas de DROP COLUMN, pas de DROP TABLE
5. **Audit middleware** capture automatiquement chaque création/modification (déjà actif)

### 8.2 Compatibilité ascendante UI
- Ancien onglet "Liste des tâches" reste affiché et fonctionnel (toutes les tâches du projet, avec ou sans activité parente)
- Nouvel onglet "Cadre logique" est additif, masquable si `programmeId == null` ET `resultats.length == 0` (mode "projet simple")
- Le Gantt continue de fonctionner sur les tâches racines du projet

### 8.3 Migration des données existantes (manuelle, projet par projet)
Aucun script automatique. Le chef de projet, quand il décide de moderniser un projet, suit cette procédure :

1. Crée 1 ou plusieurs `ResultatAttendu` (ex: "R1 - Migration de l'existant")
2. Crée 1 ou plusieurs `Activite` sous ces résultats
3. Pour chaque tâche existante, choisit : "rattacher à l'activité X" (UI multi-select)
4. Au fil de l'eau ou en une fois — au choix

**Aucune deadline imposée** — un projet peut rester en mode legacy indéfiniment.

### 8.4 Reversibilité
Si une mauvaise décision est prise (ex: rattachement erroné), une simple update (`activiteId = null`) ramène la tâche en legacy. Aucune destruction.

---

## 9. Plan de mise en œuvre par phases

### Phase 0 — Préparation données (1 jour)
**Livrable** : schémas Prisma à jour, migration appliquée, 0 régression utilisateur.

- [x] Document de référence créé (ce fichier)
- [ ] Schéma SQLite (`prisma/schema.prisma`) : ajouter Programme, ResultatAttendu, Activite + champs FK optionnels sur Projet/Tache
- [ ] Schéma MySQL (`prisma/mysql/schema.prisma`) : idem avec types `@db.VarChar(...)` et `@db.Text`
- [ ] Migration Prisma SQLite générée (`npx prisma migrate dev --name add_logframe`)
- [ ] Migration Prisma MySQL : générée + baseline appliquée sur PREPROD
- [ ] Tests : la DB locale + PREPROD restent fonctionnelles, aucun écran ne casse
- [ ] Déploiement PREPROD validé

### Phase 1 — Programme (2 jours)
**Livrable** : CRUD programme + rattachement projet.

- [ ] API `/api/programmes` (GET, POST)
- [ ] API `/api/programmes/[id]` (GET, PUT, DELETE)
- [ ] Page `/programmes` (liste + filtre + bouton "Nouveau programme")
- [ ] Page `/programmes/[id]` (détail + liste projets + édition)
- [ ] Form édition projet : ajout champ "Programme" (select)
- [ ] Filtre "Par programme" sur `/projets`
- [ ] Permissions catalogue + UI
- [ ] Navigation : ajout entrée "Programmes" sous section Projets
- [ ] Tests utilisateurs PREPROD
- [ ] Déploiement PROD

### Phase 2 — Résultats + Activités (3-4 jours)
**Livrable** : onglet "Cadre logique" opérationnel sur la page projet.

- [ ] API `/api/projets/[id]/resultats` (GET, POST)
- [ ] API `/api/resultats/[id]` (GET, PUT, DELETE)
- [ ] API `/api/resultats/[id]/activites` (GET, POST)
- [ ] API `/api/activites/[id]` (GET, PUT, DELETE)
- [ ] API `/api/activites/[id]/sous-activites` (POST — création sous-activité)
- [ ] Composant `CadreLogiqueTree` (arbre déployable Résultats→Activités→Sous-activités)
- [ ] Onglet "Cadre logique" dans `/projets/[id]/page.tsx` après "Détail tâche"
- [ ] Modale création/édition résultat
- [ ] Modale création/édition activité
- [ ] Calcul progression activité (moyenne pondérée des tâches enfants)
- [ ] Calcul progression résultat (moyenne pondérée des activités)
- [ ] Tests utilisateurs PREPROD
- [ ] Déploiement PROD

### Phase 3 — Rattachement tâches aux activités (1-2 jours)
**Livrable** : flux de rattachement guidé.

- [ ] PUT `/api/taches/[id]` accepte `activiteId`
- [ ] Création tâche depuis l'arbre du cadre logique (bouton "+ Tâche" sur une activité)
- [ ] Liste tâches d'une activité avec statut + progression
- [ ] Multi-select dans onglet "Liste des tâches" → action "Rattacher à activité…"
- [ ] Affichage du chemin Résultat>Activité dans la fiche tâche
- [ ] Tests utilisateurs PREPROD
- [ ] Déploiement PROD

### Phase 4 — LogFrame complet (3-5 jours, optionnelle)
**À planifier ultérieurement**.
- [ ] Indicateurs (OVI) par niveau
- [ ] Sources de vérification (SMV)
- [ ] Hypothèses et risques par niveau
- [ ] Budget par activité × bailleur
- [ ] Composantes/Axes thématiques
- [ ] Export Word/Excel du cadre logique au format bailleur

---

## 10. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|:---:|:---:|---|
| Confusion utilisateur entre ancien et nouveau mode | Moyen | Moyen | UI explicite : "Projet simple" vs "Projet avec cadre logique"; tooltip contextuel |
| Migration partielle d'un projet (mix legacy + structuré) | Élevé | Faible | Documentation + l'UI gère les deux états en parallèle sans erreur |
| Chefs de projets non formés au LogFrame | Élevé | Moyen | Onboarding : guide rapide intégré + exemples pré-remplis |
| Performance (N+1 sur arbre Cadre logique) | Faible | Moyen | API renvoie l'arbre complet en un GET avec `include` Prisma |
| Calcul de progression incorrect | Moyen | Faible | Tests unitaires sur `lib/progress-calculator.ts` (à créer en Phase 2) |
| Rétrocompat si Phase 4 ajoute Composantes au-dessus de Résultat | Faible | Élevé | Champ `composanteId` optionnel sur ResultatAttendu en Phase 4, idem stratégie |

---

## 11. Glossaire

| Terme | Définition |
|---|---|
| **LogFrame / Cadre logique** | Outil de planification et de suivi structurant un projet en niveaux hiérarchiques (Impact, Outcome, Output, Activity) |
| **GAR / RBM** | Gestion Axée sur les Résultats / Results-Based Management — méthodologie standard des bailleurs |
| **OVI** | Objectivement Vérifiable Indicator — indicateur mesurable d'un résultat |
| **SMV** | Source/Moyen de Vérification — comment on prouve que l'OVI est atteint |
| **Bailleur** | Organisme financeur (UE, BM, AFD, BAD, UNDP, USAID...) |
| **Output** | Résultat tangible et direct des activités, sous le contrôle du projet |
| **Outcome** | Effet à moyen terme dépendant des outputs + adoption par les bénéficiaires |
| **Cofinancement** | Plusieurs bailleurs sur un même projet/programme |

---

## 12. Annexes

### 12.1 Mapping vers code existant

| Concept LogFrame | Modèle Prisma actuel | Action |
|---|---|---|
| Impact | `Programme.description` | Pas de champ dédié (Phase 4) |
| Outcome | `Projet.description` | Pas de champ dédié (Phase 4) |
| Output | `ResultatAttendu` | **Nouveau modèle (Phase 0)** |
| Activity | `Activite` | **Nouveau modèle (Phase 0)** |
| Sub-activity | `Activite` (auto-relation) | **Nouveau modèle (Phase 0)** |
| Task | `Tache` | Existant, ajout `activiteId?` |
| Sub-task | `SousTache` | Existant, inchangé |

### 12.2 Mapping vocabulaire bailleurs

| Notre modèle | UE / FED | Banque Mondiale | AFD | UNDP / GAR |
|---|---|---|---|---|
| Programme | Programme indicatif | Country Partnership Framework | CIP / DIP | Country Programme |
| Projet | Action | Operation | Projet | Project |
| ResultatAttendu | Résultat | Component / Sub-component | Composante / Volet | Output |
| Activite | Activité | Activity | Activité | Activity |
| Tache | Tâche d'exécution | Task | Tâche | Task |

### 12.3 Exemples de codification

```
PROG-SANTE-2028 (Programme)
└─ PRJ-001 — Renforcement soins prénatals (Projet)
    └─ R1 — 50 centres de santé équipés (ResultatAttendu)
    │   └─ A1.1 — Achat équipements médicaux (Activite)
    │   │   └─ A1.1.1 — Spec techniques (Sous-activité)
    │   │   └─ A1.1.2 — Appel d'offres (Sous-activité)
    │   │       └─ Tâche : Rédiger DAO (Tache)
    │   │       └─ Tâche : Publication BOAMP (Tache)
    │   └─ A1.2 — Installation et formation (Activite)
    └─ R2 — 200 sages-femmes formées (ResultatAttendu)
        └─ A2.1 — Module théorique (Activite)
        └─ A2.2 — Stages cliniques (Activite)
```

---

## 13. Suivi d'avancement

### État global
- [x] **Phase 0** : Document de référence rédigé
- [ ] **Phase 0** : Schémas Prisma mis à jour
- [ ] **Phase 0** : Migration générée et appliquée
- [ ] **Phase 0** : Déploiement PREPROD validé
- [ ] **Phase 1** : Programme (CRUD + UI)
- [ ] **Phase 2** : Résultats + Activités (CRUD + UI)
- [ ] **Phase 3** : Rattachement tâches
- [ ] **Phase 4** : LogFrame complet (indicateurs, budget) — _différée_

### Journal des décisions
| Date | Décision | Justification |
|---|---|---|
| 2026-04-23 | Option **B** retenue (LogFrame simplifié) | Meilleur rapport valeur/complexité |
| 2026-04-23 | Auto-relation pour sous-activités | Plus flexible que modèle SousActivite distinct |
| 2026-04-23 | Budget/Indicateurs reportés en Phase 4 | Hors scope MVP |
| 2026-04-23 | `Projet.entitePorteuse` conservé même avec Programme | Sécurité et traçabilité |
| 2026-04-23 | Opérations/Occurrences hors cadre logique | Récurrence ≠ delivery projet |

### Journal des changements (à tenir à jour à chaque session)
| Date | Phase | Action | Auteur |
|---|---|---|---|
| 2026-04-23 | 0 | Création du document | Claude/Dev |
