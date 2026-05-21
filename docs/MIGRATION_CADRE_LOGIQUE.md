# Migration vers la Gestion par Cadre Logique (LogFrame simplifié)

**Statut** : Phase 0 ✅ **TERMINÉE et déployée en PROD** — prochaine étape : Phase 1 (UI Programme)
**Dernière mise à jour** : 2026-05-21
**Document de référence unique** — toute décision liée à cette évolution doit être tracée ici.

> **Boussole de session** : ce document remplace toute mémoire conversationnelle pour cette migration. Une session ouverte sur ce sujet doit le lire en premier et le mettre à jour à chaque jalon franchi (case à cocher en bas).

---

## 1. Vision et contexte

### 1.1 Problème
Le tracker actuel suit la logique simple : **Projet → Tâche → [Sous-tâche]**.
Insuffisant pour des projets financés par des bailleurs internationaux (UE, BM, AFD, BAD, UNDP, USAID) qui exigent un reporting selon le standard **Gestion Axée sur les Résultats (GAR) / Cadre Logique (LogFrame)**.

### 1.2 Objectif
Évoluer vers :
```
Programme → Projet → Résultat attendu → Activité → [Sous-activité] → Tâche → [Sous-tâche]
```
En préservant **100 % des données existantes** et sans régression.

### 1.3 Hors scope (Phase 4)
- Indicateurs (OVI), sources de vérification (SMV), hypothèses
- Budget par activité × bailleur (cofinancement)
- Composantes/Axes thématiques au-dessus de Résultat
- Import Word/Excel des cadres logiques existants

---

## 2. Cadre de référence — Standards bailleurs

| Niveau LogFrame | Terme bailleur (FR) | Anglais | Horizon |
|---|---|---|---|
| Impact | Finalité / Objectif global | Impact / Goal | 5-10 ans |
| Outcome | Objectif spécifique | Outcome / Purpose | 3-5 ans |
| **Output** | **Résultat attendu** | **Output / Result** | **1-3 ans** |
| **Activity** | **Activité** | **Activity** | **Semaines/mois** |
| **Task** | **Tâche opérationnelle** | **Task** | **Jours** |

Impact + Outcome reflétés implicitement dans `Programme.description` et `Projet.description`. **Programme** regroupe plusieurs projets partageant une finalité commune et une enveloppe budgétaire.

---

## 3. Hiérarchie retenue (Option B — LogFrame simplifié)

```
Programme
 └─ Projet
     └─ Résultat attendu (Output)
         └─ Activité
             └─ [Sous-activité (auto-relation)]
                 └─ Tâche (existant)
                     └─ [Sous-tâche (existant)]
```

### 3.1 Conventions de codification
- **Programme** : libre, ex. `PROG-SANTE-2028`
- **Projet** : libre, ex. `PRJ-001`
- **Résultat** : `R<n>`, ex. `R1`, `R2`
- **Activité** : `A<résultat>.<n>`, ex. `A1.1`, `A1.2`
- **Sous-activité** : `A<résultat>.<n>.<m>`, ex. `A1.1.1`

### 3.2 Cardinalités

| Relation | Min..Max | Note |
|---|---|---|
| Programme → Projet | 0..N | Programme peut être vide |
| Projet → Programme | 0..1 | Projet peut être hors programme (legacy) |
| Projet → Résultat | 0..N | Résultats optionnels |
| Résultat → Activité | 1..N | Un résultat sans activité = WIP |
| Activité → Sous-activité | 0..N | Profondeur libre via auto-relation |
| Activité → Tâche | 0..N | Une activité peut être trop fine |
| Tâche → Activité | 0..1 | Tâche legacy = directement sur projet |

---

## 4. Modélisation des données

### 4.1 Diagramme conceptuel

```
┌──────────────┐ 1───N ┌──────────┐ 1───N ┌─────────────────┐
│  Programme   │ ────► │  Projet  │ ────► │ ResultatAttendu │
└──────────────┘       └──────────┘       └─────────────────┘
                            │                       │
                            │ N (legacy)            │ N
                            ▼                       ▼
                       ┌─────────┐ N───1   ┌──────────┐
                       │  Tache  │ ◄────── │ Activite │ ◄─┐ self-relation
                       └─────────┘  0..1   └──────────┘   │ parent/enfants
                            │                     └──────┘
                            │ 1
                            │ N
                            ▼
                       ┌──────────┐
                       │ SousTache│
                       └──────────┘
```

### 4.2 Nouveaux modèles Prisma (ajoutés)

```prisma
model Programme {
  id           String    @id @default(cuid())
  libelle      String    @unique
  code         String?   @unique           // sigle court
  description  String?
  bailleur     String?                     // texte libre "UE - FED 11"
  dateDebut    DateTime?
  dateFin      DateTime?
  budgetTotal  Float?
  devise       String    @default("XOF")
  statut       String    @default("Actif") // Actif | Clôturé | Archivé
  entiteId     String?
  creePar      String?
  creeLe       DateTime?
  modifiePar   String?
  modifieLe    DateTime?

  entite   Entite?  @relation("ProgrammePilote", fields: [entiteId], references: [id], onDelete: SetNull)
  projets  Projet[]

  @@map("programmes")
}

model ResultatAttendu {
  id          String  @id @default(cuid())
  projetId    String
  code        String                       // "R1", "R2"
  libelle     String
  description String?
  ordre       Int     @default(0)
  creePar     String?
  creeLe      DateTime?
  modifiePar  String?
  modifieLe   DateTime?

  projet    Projet     @relation(fields: [projetId], references: [id], onDelete: Cascade)
  activites Activite[]

  @@unique([projetId, code])
  @@map("resultats_attendus")
}

model Activite {
  id               String    @id @default(cuid())
  resultatId       String
  parentActiviteId String?
  code             String                           // "A1.1"
  libelle          String
  description      String?
  responsableId    String?
  dateDebutPrev    DateTime?
  dateFinPrev      DateTime?
  dateDebutEff     DateTime?
  dateFinEff       DateTime?
  statut           String    @default("Planifiée")  // Planifiée | En cours | Terminée | Annulée | Suspendue
  progression      Int       @default(0)
  ordre            Int       @default(0)
  creePar          String?
  creeLe           DateTime?
  modifiePar       String?
  modifieLe        DateTime?

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

- **Projet** : ajout `programmeId String?` + relation `programme Programme?` + back-relation `resultats ResultatAttendu[]`
- **Tache** : ajout `activiteId String?` + relation `activite Activite?`
- **Entite** : back-relation `programmesPilotes Programme[]`
- **PersonneRessource** : back-relation `activitesResponsables Activite[]`

### 4.4 Sécurités (zéro perte de données)

| Champ | NULL ? | Pourquoi |
|---|---|---|
| `Projet.programmeId` | NULL OK | Projet legacy reste valide |
| `Tache.activiteId` | NULL OK | Tâche legacy reste valide |
| `Activite.parentActiviteId` | NULL OK | Activité racine |
| `Activite.responsableId` | NULL OK | Pas toujours assignée |
| `Programme.entiteId` | NULL OK | Programme inter-entités |

Toutes les FK utilisent `onDelete: SetNull` (sauf relations parent-enfant en `Cascade`). Aucune destruction en chaîne.

---

## 5. User Stories prioritaires

### Programme
- **US-PG-01** Coordinateur : créer un programme (libellé, bailleur, dates, budget)
- **US-PG-02** Coordinateur : rattacher un projet existant à un programme
- **US-PG-03** Coordinateur : dashboard programme avec projets + taux d'avancement

### Cadre logique
- **US-CL-01** Chef projet : créer un résultat attendu (code + libellé)
- **US-CL-02** Chef projet : ajouter des activités sous un résultat
- **US-CL-03** Chef projet : décomposer une activité en sous-activités
- **US-CL-04** Chef projet : visualiser le cadre logique sous forme d'arbre

### Tâches
- **US-TK-01** Chef projet : rattacher une tâche existante à une activité
- **US-TK-02** Chef projet : créer une tâche directement sous une activité
- **US-TK-03** Chef projet : liste des tâches d'une activité + progression

### Compatibilité legacy
- **US-LG-01** Tâches existantes restent visibles sans activité parente
- **US-LG-02** Migration projet par projet, pas de rupture

---

## 6. Matrice RACI (R/A/C/I)

| Action | Chef projet | Coordinateur | Gestionnaire | Agent |
|---|:---:|:---:|:---:|:---:|
| Créer un programme | I | R/A | — | — |
| Rattacher projet à programme | C | R/A | — | — |
| Créer résultat attendu | R/A | C | — | — |
| Créer activité | R | A | C | — |
| Assigner responsable activité | R/A | I | I | — |
| Créer tâche sous activité | R | I | C | — |
| Rattacher tâche legacy à activité | R/A | I | C | — |
| MAJ statut activité | C | I | R/A | — |
| MAJ statut tâche | C | — | C | R/A |

---

## 7. Permissions

### 7.1 Nouvelles entrées au catalogue

| pageKey | actionKey |
|---|---|
| `programmes` | `read` / `write` / `delete` |
| `cadre-logique` | `read` / `write` / `delete` |

### 7.2 Mapping rôles

| Rôle | programmes:read | programmes:write | cadre-logique:read | cadre-logique:write |
|---|:---:|:---:|:---:|:---:|
| AGENT | ✓ | ✗ | ✓ (ses projets) | ✗ |
| GESTIONNAIRE | ✓ | ✗ | ✓ | ✓ (ses activités) |
| COORDINATEUR | ✓ | ✓ | ✓ | ✓ |
| ADMINISTRATEUR | ✓ | ✓ | ✓ | ✓ |

### 7.3 Helpers `lib/require-auth.ts` à ajouter
- `canManageProgramme(user)` → COORDINATEUR+
- `canManageResultat(user, projet)` → super-admin OU COORDINATEUR+ OU chef projet
- `canManageActivite(user, projet, activite)` → idem + responsable d'activité si GESTIONNAIRE

---

## 8. Stratégie de migration (zéro perte, zéro régression)

### Principe directeur
**Cohabitation** : ajouter sans toucher à l'existant. Faire vivre les deux mondes jusqu'à adoption complète.

### Sécurités techniques
1. `programmeId` et `activiteId` sont **NULL** → aucune contrainte rétroactive
2. `onDelete: SetNull` sur ces FK
3. **Aucune suppression ni réécriture** de données existantes
4. Migration Prisma **additive** : pas de DROP COLUMN, pas de DROP TABLE
5. Audit middleware capture automatiquement les nouvelles entités

### Compatibilité ascendante UI
- Ancien onglet "Liste des tâches" reste actif (toutes tâches, avec ou sans activité parente)
- Nouvel onglet "Cadre logique" est additif
- Le Gantt continue de fonctionner

### Migration progressive (manuelle, par projet)
Aucun script auto. Le chef projet :
1. Crée 1+ `ResultatAttendu` (ex: "R1 - Migration de l'existant")
2. Crée 1+ `Activite` sous ces résultats
3. Multi-select dans "Liste des tâches" → "Rattacher à activité…"
4. Au fil de l'eau ou en une fois — **aucune deadline**

---

## 9. Plan de mise en œuvre par phases

### Phase 0 ✅ — Préparation données (TERMINÉE)
- [x] Document de référence créé
- [x] Schemas Prisma SQLite + MySQL modifiés
- [x] Migration SQLite `20260511100000_add_logframe` générée + appliquée localement
- [x] Migration MySQL `20260511100000_add_logframe` écrite (CREATE TABLE + ALTER ADD COLUMN nullable)
- [x] Backups MySQL PREPROD + PROD effectués (`~/backups/`)
- [x] Backup SQLite local (`prisma/dev.db.backup_avant_logframe`)
- [x] Commit + push `dev`
- [x] Déploiement PREPROD validé (workflow vert + login OK + DB intacte + colonnes programmeId/activiteId présentes)
- [x] Déploiement PROD validé (workflow vert + 14 comptes/27 projets inchangés + colonnes ajoutées)

### Phase 1 — Programme (2 jours)
- [ ] API `/api/programmes` (GET, POST) + `/api/programmes/[id]` (GET, PUT, DELETE)
- [ ] Page `/programmes` (liste + filtre) + `/programmes/[id]` (détail)
- [ ] Form édition projet : champ "Programme" (select)
- [ ] Filtre "Par programme" sur `/projets`
- [ ] Permissions catalogue + UI
- [ ] Navigation : entrée "Programmes" sous section Projets

### Phase 2 — Résultats + Activités (3-4 jours)
- [ ] API `/api/projets/[id]/resultats` + `/api/resultats/[id]` + `/api/resultats/[id]/activites` + `/api/activites/[id]`
- [ ] Composant `CadreLogiqueTree` (arbre déployable)
- [ ] Onglet "Cadre logique" dans `/projets/[id]/page.tsx`
- [ ] Modales création/édition résultat + activité
- [ ] Calcul de progression (moyenne pondérée des tâches/activités enfants)

### Phase 3 — Rattachement tâches (1-2 jours)
- [ ] PUT `/api/taches/[id]` accepte `activiteId`
- [ ] Création tâche depuis l'arbre LogFrame
- [ ] Multi-select "Rattacher à activité…" dans liste des tâches
- [ ] Affichage chemin Résultat>Activité dans fiche tâche

### Phase 4 — LogFrame complet (différée, 3-5 jours)
- [ ] Indicateurs (OVI) par niveau
- [ ] Sources de vérification (SMV)
- [ ] Hypothèses et risques par niveau
- [ ] Budget par activité × bailleur
- [ ] Composantes/Axes thématiques
- [ ] Export Word/Excel format bailleur

---

## 10. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|:---:|:---:|---|
| Confusion ancien/nouveau mode | Moyen | Moyen | UI explicite "Projet simple" vs "Avec cadre logique" + tooltip |
| Migration partielle mixte | Élevé | Faible | UI gère les deux états sans erreur |
| Chefs non formés au LogFrame | Élevé | Moyen | Guide rapide intégré + exemples |
| Performance arbre LogFrame (N+1) | Faible | Moyen | API renvoie l'arbre complet en un GET avec `include` |
| Calcul progression incorrect | Moyen | Faible | Tests unitaires sur `lib/progress-calculator.ts` |

---

## 11. Glossaire

| Terme | Définition |
|---|---|
| **LogFrame** | Cadre logique — outil de planification structurant un projet en niveaux hiérarchiques |
| **GAR / RBM** | Gestion Axée sur les Résultats — standard des bailleurs |
| **OVI** | Indicateur Objectivement Vérifiable |
| **SMV** | Source/Moyen de Vérification |
| **Bailleur** | Organisme financeur (UE, BM, AFD, BAD, UNDP, USAID) |
| **Output** | Résultat tangible et direct des activités |
| **Outcome** | Effet à moyen terme dépendant des outputs |
| **Cofinancement** | Plusieurs bailleurs sur un même projet |

---

## 12. Annexes

### 12.1 Mapping vocabulaire bailleurs

| Notre modèle | UE/FED | BM | AFD | UNDP/GAR |
|---|---|---|---|---|
| Programme | Programme indicatif | Country Partnership Framework | CIP/DIP | Country Programme |
| Projet | Action | Operation | Projet | Project |
| ResultatAttendu | Résultat | Component | Composante/Volet | Output |
| Activite | Activité | Activity | Activité | Activity |
| Tache | Tâche d'exécution | Task | Tâche | Task |

### 12.2 Exemple de codification

```
PROG-SANTE-2028 (Programme)
└─ PRJ-001 — Renforcement soins prénatals (Projet)
    └─ R1 — 50 centres de santé équipés (ResultatAttendu)
    │   └─ A1.1 — Achat équipements médicaux (Activite)
    │   │   └─ A1.1.1 — Spec techniques (Sous-activité)
    │   │   └─ A1.1.2 — Appel d'offres (Sous-activité)
    │   │       └─ Tâche : Rédiger DAO
    │   │       └─ Tâche : Publication BOAMP
    │   └─ A1.2 — Installation et formation (Activite)
    └─ R2 — 200 sages-femmes formées (ResultatAttendu)
        └─ A2.1 — Module théorique
        └─ A2.2 — Stages cliniques
```

---

## 13. Suivi d'avancement

### État global
- [x] **Phase 0 : TERMINÉE et déployée en PROD ✅**
- [x] Phase 0 : Document de référence rédigé
- [x] Phase 0 : Schémas Prisma mis à jour (SQLite + MySQL)
- [x] Phase 0 : Migration locale appliquée sans perte
- [x] Phase 0 : Migration MySQL écrite et prête
- [x] Phase 0 : Déploiement PREPROD validé
- [x] Phase 0 : Déploiement PROD validé
- [ ] Phase 1 : Programme (CRUD + UI)
- [ ] Phase 2 : Résultats + Activités
- [ ] Phase 3 : Rattachement tâches
- [ ] Phase 4 : LogFrame complet — _différée_

### Journal des décisions

| Date | Décision | Justification |
|---|---|---|
| 2026-04-23 | Option B retenue (LogFrame simplifié) | Meilleur rapport valeur/complexité |
| 2026-04-23 | Auto-relation pour sous-activités | Plus flexible qu'un modèle SousActivite distinct |
| 2026-04-23 | Budget/Indicateurs reportés en Phase 4 | Hors scope MVP |
| 2026-04-23 | `Projet.entitePorteuse` conservé même avec Programme | Sécurité et traçabilité |
| 2026-04-23 | Opérations/Occurrences hors cadre logique | Récurrence ≠ delivery projet |
| 2026-05-21 | Migration MySQL écrite manuellement (pas via Prisma diff) | Pas de shadow DB disponible |
| 2026-05-21 | Drop des 3 tables locales LogFrame vides (legacy `db push`) | Préparer une migration unifiée |

### Journal des changements

| Date | Phase | Action | Auteur |
|---|---|---|---|
| 2026-04-23 | 0 | Création du document | Claude/Dev |
| 2026-05-21 | 0 | Schemas Prisma + migrations SQLite/MySQL générés | Claude/Dev |
| 2026-05-21 | 0 | Phase 0 TERMINÉE — déployée en PROD sans perte | Claude/Dev |
