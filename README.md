# PAPE-D PROJECT TRACKER

Application de gestion des tâches et projets basée sur une architecture **Next.js + React + Prisma + SQLite**.

## 🚀 Fonctionnalités V1

### 1. Gestion des Projets
- ✅ Création et modification de projets
- ✅ États: Démarrage, En cours, Terminé, Réceptionné, Clôturé
- ✅ Vue détaillée par projet
- ✅ Responsable obligatoire (Chef de projet)

### 2. Gestion des Entités
- ✅ Création d'entités organizationnelles
- ✅ Tutelle associée
- ✅ Gestion des personnes ressources par entité

### 3. Gestion des Personnes Ressources
- ✅ Profil complet: Nom, Prénoms, Email, Fonction, Téléphone
- ✅ Affiliation à une entité
- ✅ Indicateur chef de projet
- ✅ Association dynamique à l'équipe projet

### 4. Gestion des Tâches
- ✅ Création dans un projet
- ✅ Libellé, description, priorité (Haute/Moyenne/Basse)
- ✅ Statuts: Backlog → À faire → En cours → En attente → Bloqué → Terminé → À valider → Validé
- ✅ Assignation à une personne ressource
- ✅ Dates: création, début/fin prévisionnelles, début/fin effectives
- ✅ Dates effectives remplies automatiquement à la transition

### 5. Tableau Kanban
- ✅ Vue par statut avec colonnes glissables
- ✅ Passage rapide des tâches au statut suivant
- ✅ Couleur par priorité
- ✅ Affichage assigné

### 6. Diagramme de Gantt
- ✅ Visualisation du planning par tâche
- ✅ Timeline automatique basée sur les dates prévues
- ✅ Couleur par statut
- ✅ Accès depuis `/projets/[id]/gantt`

### 7. Backlog
- ✅ Les tâches créées commencent en **Backlog**
- ✅ Passage automatique à **À faire** lors de l'assignation
- ✅ Priorité visible

### 8. Dashboard Global
- ✅ KPIs: Total tâches, terminées, bloquées, projets actifs
- ✅ Filtres par projet et statut
- ✅ Synthèse par projet
- ✅ Répartition par priorité
- ✅ Vélocité par projet
- ✅ Liste des tâches filtrées

## 🛠️ Stack Technique

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de données**: Prisma ORM + SQLite
- **Validation**: TypeScript strict
- **UI Components**: Tailwind CSS

## 📦 Installation et Démarrage

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation
```bash
cd "PAPE-D PROJECT TRACKER"
npm install
```

### Configuration
Le fichier `.env` est déjà configuré pour SQLite:
```
DATABASE_URL="file:./prisma/dev.db"
```

### Lancer le serveur de développement
```bash
npm run dev
```

L'application sera accessible à: **http://localhost:3000**
(ou http://localhost:3001 si 3000 est occupé)

### Générer le client Prisma
```bash
npm run prisma:generate
```

### Migrer la base de données
```bash
npm run prisma:migrate
```

## 📄 Pages et Routes

### Pages Principales
- `/` - Accueil
- `/tableau-de-bord` - Dashboard global avec indicateurs
- `/projets` - Liste des projets
- `/projets/[id]` - Détail projet avec Kanban
- `/projets/[id]/gantt` - Diagramme de Gantt
- `/entites` - Gestion des entités
- `/personnes` - Gestion des personnes ressources

### API Routes
- `POST/GET /api/projets` - Gestion projets
- `GET/PUT/DELETE /api/projets/[id]` - Détail projet
- `POST/GET /api/taches` - Gestion tâches
- `PUT/DELETE /api/taches/[id]` - Mise à jour statut, dates
- `POST/GET /api/entites` - Gestion entités
- `POST/GET /api/personnes` - Gestion personnes

## 📊 Schéma de Données

### Modèles
- **Projet**: id, libelle, description, statut, chefProjetId, dateCreation
- **Entité**: id, libelle, tutelle
- **PersonneRessource**: id, nom, prénoms, email, fonction, entiteId, estChefProjet
- **PartiePrenante**: id, libelle, type, entiteId (optionnel)
- **Tâche**: id, projetId, libelle, description, priorité, assignéAId, statut, dates
- **TâchePériodique** (V2): id, libelle, périodicité, responsableId, entitéExecutionId, statut

## 🎯 Règles Métier Implémentées

- ✅ Un projet doit avoir un chef de projet
- ✅ Une tâche créée va d'abord en Backlog
- ✅ Une tâche attribuée passe en "À faire"
- ✅ Une tâche commencée remplir automatiquement dateDebutEffective
- ✅ Une tâche terminée remplit automatiquement dateFinEffective
- ✅ Une personne assignée devient membre de l'équipe projet si elle ne l'était pas
- ✅ Les indicateurs du dashboard sont filtrables par projet et statut
- ✅ La vélocité est calculée par projet (% de tâches terminées)

## 🔮 Prochaines Étapes (V2)

- Gestion des tâches périodiques (quotidiennes, hebdomadaires, mensuelles)
- Gestion des parties prenantes avec catégories
- Export en Excel/CSV
- Rapports PDF
- Notifications par email
- Gestion des risques
- Multi-utilisateurs avec authentification
- Commentaires sur les tâches
- Historique des modifications
- Drag & drop natif (react-beautiful-dnd)
- Intégrations externes (Microsoft Project, Jira)

## 📝 Structure du Projet

```
PAPE-D PROJECT TRACKER/
├── app/
│   ├── api/                 # API Routes Next.js
│   │   ├── projets/
│   │   ├── taches/
│   │   ├── entites/
│   │   └── personnes/
│   ├── projets/             # Pages projets
│   │   ├── page.tsx         # Liste
│   │   ├── [id]/page.tsx    # Détail + Kanban
│   │   └── [id]/gantt/page.tsx # Gantt
│   ├── entites/             # Pages entités
│   ├── personnes/           # Pages personnes
│   ├── tableau-de-bord/     # Dashboard global
│   ├── page.tsx             # Accueil
│   ├── layout.tsx           # Layout principal
│   └── globals.css          # Styles globaux
├── components/              # Composants réutilisables
│   └── Navigation.tsx       # Navigation principale
├── lib/                     # Utilitaires
│   └── prisma.ts           # Client Prisma
├── prisma/                  # Prisma
│   ├── schema.prisma       # Schéma de base de données
│   ├── dev.db              # Base SQLite
│   └── migrations/         # Historique migrations
├── public/                  # Assets statiques
├── .env                     # Variables d'environnement
├── .env.local              # Variables locales (dev)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🎨 Design

Couleurs principales:
- Primaire: #0f5362 (bleu foncé)
- Secondaire: #2a9d8f (teal)
- Accent: #e9c46a (or)
- Danger: #d62828 (rouge)

## ✅ Tests Manuels

1. Créer une entité
2. Créer une personne ressource
3. Créer un projet avec le chef de projet
4. Créer une tâche dans le projet
5. Assigner la tâche à une personne
6. Voir la personne dans l'équipe projet automatiquement
7. Changer le statut via Kanban
8. Vérifier les dates effectives remplies
9. Accéder au Gantt et vérifier la timeline
10. Consulter le dashboard global

## 📞 Support

Documentation Prisma: https://www.prisma.io/docs/
Documentation Next.js: https://nextjs.org/docs
Tailwind CSS: https://tailwindcss.com/docs

---

**PAPE-D PROJECT TRACKER** - Gestion simplifiée et efficace de projets 🚀
