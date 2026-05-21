# Use case de test — Cadre Logique end-to-end

**Objectif** : valider de bout en bout le flux Programme → Projet → Résultat → Activité → Sous-activité → Tâche après déploiement des Phases 1, 2, 3.

**Persona testeur** : super-admin (`super@super` / `0123456789`) ou un compte COORDINATEUR.

**Durée estimée** : 20-30 min.

---

## Scénario fictif

> **Programme** : "Renforcement du système national de santé maternelle 2026-2030"
> Financé par l'UE (FED 11), enveloppe 2 500 000 000 XOF.
>
> **Projet 1 du programme** : "Équipement des centres de santé du district sanitaire d'Abidjan"
> Chef de projet : un PersonneRessource existant.
>
> **Cadre logique** :
> - R1 : 50 centres de santé équipés en matériel obstétrique
>   - A1.1 : Acquisition du matériel
>     - A1.1.1 : Spécifications techniques
>     - A1.1.2 : Appel d'offres et sélection fournisseur
>     - A1.1.3 : Livraison et réception
>   - A1.2 : Installation et formation du personnel
> - R2 : 200 sages-femmes formées en techniques modernes
>   - A2.1 : Conception du module théorique
>   - A2.2 : Stages cliniques supervisés

---

## Étapes de test

### Étape 1 — Créer le Programme

1. Aller sur https://dev-paped-projet.mshpcmu.ci → se connecter
2. Cliquer sur l'icône **PROGRAMMES** dans la navigation (sous-section Projets)
3. Cliquer sur **+ Nouveau programme**
4. Remplir :
   - **Libellé** : `Renforcement du système national de santé maternelle 2026-2030`
   - **Code** : `PROG-SANTE-2030`
   - **Bailleur** : `UE - FED 11`
   - **Description** : `Programme national visant à améliorer la santé maternelle et néonatale par l'équipement des centres de santé et la formation du personnel.`
   - **Statut** : `Actif`
   - **Date début** : 01/01/2026
   - **Date fin** : 31/12/2030
   - **Budget total** : `2500000000`
   - **Devise** : `XOF`
   - **Entité pilote** : (sélectionner une entité existante)
5. **Créer** → on doit voir une carte programme apparaître sur la liste.

✅ **Validation** :
- La carte affiche les bonnes infos
- Cliquer dessus mène à la page détail
- L'historique de modifications montre l'action CREATE

### Étape 2 — Créer un Projet rattaché au Programme

1. Aller sur **LISTE PROJETS** → **+ Nouveau projet**
2. Créer un projet "Équipement des centres de santé du district sanitaire d'Abidjan" avec un chef de projet
3. Une fois créé, l'ouvrir → onglet **Informations générales**
4. Dans le formulaire, choisir **Programme** = `[PROG-SANTE-2030] Renforcement du système national de santé maternelle 2026-2030`
5. **Enregistrer**

✅ **Validation** :
- Revenir sur la page du programme → le projet apparaît dans la liste des projets rattachés
- Le compteur "projets" sur la carte programme passe de 0 à 1

### Étape 3 — Construire le cadre logique

1. Ouvrir le projet → onglet **Cadre logique** (nouvel onglet)
2. Cliquer **+ Nouveau résultat**
3. Code `R1`, libellé `50 centres de santé équipés en matériel obstétrique`, description courte. **Créer**.
4. Ouvrir R1 (chevron) → bouton **+** sur la ligne R1 pour créer une activité
5. Code `A1.1`, libellé `Acquisition du matériel`, responsable + dates. **Créer**.
6. Ouvrir A1.1 → bouton **+** sur la ligne pour créer une sous-activité
7. Créer `A1.1.1 - Spécifications techniques`, `A1.1.2 - Appel d'offres`, `A1.1.3 - Livraison`
8. Créer aussi `A1.2 - Installation et formation`
9. Créer `R2` et ses activités `A2.1`, `A2.2`

✅ **Validation** :
- L'arbre se déploie correctement
- Les codes sont uniques par niveau (le système refuse les doublons)
- Chaque création apparaît dans l'historique du projet

### Étape 4 — Créer des tâches et les rattacher à une activité

1. Onglet **Liste des tâches** → créer 2 tâches :
   - "Rédiger le DAO (Document d'Appel d'Offres)"
   - "Publier l'AO sur le BOAMP"
2. Revenir sur **Cadre logique**, ouvrir A1.1 puis A1.1.2 (Appel d'offres)
3. Survoler la ligne A1.1.2 → cliquer sur l'icône **chaîne** (Link2)
4. Modale "Rattacher des tâches à A1.1.2" s'ouvre
5. Cocher les deux tâches dans la section "Tâches non rattachées"
6. **Enregistrer**

✅ **Validation** :
- Les deux tâches apparaissent maintenant dans l'historique de A1.1.2 (champ `activiteId` modifié)
- Si on rouvre la modale, elles sont dans "Tâches déjà rattachées à cette activité"
- L'arbre affiche le compteur `2 tâche(s)` à côté de A1.1.2

### Étape 5 — Modifier une activité

1. Ouvrir l'activité A1.1.2 (clic sur Pencil)
2. Changer statut → **En cours**, progression → 30
3. **Enregistrer**

✅ **Validation** :
- Le badge statut bascule en sky (En cours)
- La progression affiche 30%
- L'historique de l'activité montre l'UPDATE avec le diff statut + progression

### Étape 6 — Tester les permissions

1. Se déconnecter
2. Se reconnecter en compte **AGENT** (ou créer un compte test si nécessaire)
3. Aller sur le projet → onglet **Cadre logique**

✅ **Validation** :
- Pour un AGENT non-chef du projet : pas de bouton "+ Nouveau résultat", pas d'icônes d'action
- Pour un AGENT chef du projet ou COORDINATEUR+ : tous les boutons d'édition visibles

### Étape 7 — Vérifier l'audit trail

1. Sur le projet → onglet **Historique**
2. Doit lister chronologiquement tous les CREATE/UPDATE/DELETE faits aux étapes 2-5

✅ **Validation** :
- Chaque action est tracée avec l'auteur, la date, et le diff avant/après
- Action `UPDATE` sur Tache montre le champ `activiteId` qui passe de `null` à l'ID

### Étape 8 — Cas de suppression bloquante

1. Sur le cadre logique, essayer de supprimer A1.1.2 (qui a 2 tâches rattachées)
2. Doit afficher une erreur : `Impossible de supprimer : 2 tâche(s) et 0 sous-activité(s) rattachées.`
3. Essayer de supprimer A1.1 (qui a 3 sous-activités)
4. Doit afficher une erreur similaire.
5. Pour la supprimer pour de vrai, il faudrait d'abord supprimer ou détacher tout le contenu.

✅ **Validation** :
- Les soft-protections fonctionnent (zéro perte involontaire)
- Les messages d'erreur sont clairs

### Étape 9 — Cas projet hors programme (legacy)

1. Créer un nouveau projet **SANS** sélectionner de programme
2. Vérifier qu'il fonctionne normalement
3. L'ouvrir → onglet **Cadre logique** : doit s'afficher (vide)
4. Ouvrir **Liste des tâches** : tâches existantes (legacy) restent visibles sans activité parente

✅ **Validation** :
- La compatibilité ascendante est préservée
- Les tâches sans `activiteId` ne disparaissent pas

### Étape 10 — Suppression d'un programme avec projets

1. Aller sur le programme créé
2. Tenter de le supprimer
3. Doit afficher : `Impossible de supprimer : 1 projet(s) rattaché(s). Détachez-les ou archivez le programme.`
4. Détacher le projet (revenir dans le projet → Programme = "Aucun") OU archiver le programme (statut = `Archivé`)

✅ **Validation** :
- Protection contre suppression cascade
- Alternative "Archivé" disponible

---

## Critères de réussite globaux

- [ ] Création de tous les niveaux LogFrame sans erreur
- [ ] Codes uniques respectés (R*, A*.*)
- [ ] Rattachement tâches → activités fonctionnel (multi-select)
- [ ] Permissions appliquées correctement par rôle
- [ ] Audit trail complet pour chaque entité
- [ ] Aucune régression sur les fonctionnalités existantes (Liste des tâches, Gantt, Reporting…)
- [ ] Compatibilité legacy : projets sans programme + tâches sans activité fonctionnent normalement
- [ ] Protections de suppression actives (résultat avec activités, activité avec tâches, programme avec projets)

---

## Nettoyage après test (optionnel)

1. Supprimer les tâches de test
2. Supprimer les activités feuilles, puis remonter
3. Supprimer les résultats
4. Détacher le projet du programme
5. Supprimer le projet
6. Supprimer le programme

---

## Endpoints sollicités pendant le test

| Méthode | URL | Étape |
|---|---|---|
| POST | `/api/programmes` | 1 |
| PUT | `/api/projets/[id]` (avec `programmeId`) | 2 |
| GET | `/api/programmes/[id]` | 2 |
| POST | `/api/projets/[id]/resultats` | 3 |
| POST | `/api/resultats/[id]/activites` | 3 |
| PUT | `/api/taches/[id]` (avec `activiteId`) | 4 |
| PUT | `/api/activites/[id]` | 5 |
| GET | `/api/historique/Projet/[id]` | 7 |
| DELETE | `/api/activites/[id]` (échec attendu) | 8 |
| DELETE | `/api/programmes/[id]` (échec attendu) | 10 |

---

**Validation finale** : à la fin du test, l'utilisateur doit pouvoir produire un rapport "Programme → Projet → Cadre logique → Activités → Tâches" sans intervention technique (juste via l'UI).
