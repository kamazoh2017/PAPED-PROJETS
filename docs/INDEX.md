# 📚 Index du Projet PAPE-D PROJECT TRACKER

## 📖 Documentation Principale

- **[README.md](./README.md)** - Documentation complète, features, architecture
- **[QUICKSTART.md](./QUICKSTART.md)** - Guide de démarrage rapide en 5 min
- **[CHANGELOG.md](./CHANGELOG.md)** - Historique des versions et roadmap

## 🗂️ Structure du Projet

### `/app` - Application Next.js

#### Pages Principales
- `page.tsx` - Page d'accueil avec navigation
- `layout.tsx` - Layout principal avec navigation globale
- `globals.css` - Styles globaux

#### `/projets`
- `page.tsx` - Liste des projets avec création
- `[id]/page.tsx` - Détail projet avec Kanban board
- `[id]/gantt/page.tsx` - Diagramme de Gantt

#### `/tableau-de-bord`
- `page.tsx` - Dashboard global avec 10+ KPIs et filtres

#### `/entites`
- `page.tsx` - Gestion des entités organizationnelles

#### `/personnes`
- `page.tsx` - Gestion des personnes ressources

### `/api` - API Routes Next.js

#### `/api/projets`
- `route.ts` - GET (liste), POST (créer)
- `[id]/route.ts` - GET (détail), PUT (modifier), DELETE (supprimer)

#### `/api/taches`
- `route.ts` - GET (liste), POST (créer)
- `[id]/route.ts` - PUT (modifier statut/dates), DELETE (supprimer)

#### `/api/entites`
- `route.ts` - GET (liste), POST (créer)

#### `/api/personnes`
- `route.ts` - GET (liste), POST (créer)

### `/components` - Composants React

- `Navigation.tsx` - Barre de navigation principale
- *À étendre avec d'autres composants*

### `/lib` - Utilitaires et Configuration

- `prisma.ts` - Client Prisma singleton

### `/prisma` - Prisma ORM

- `schema.prisma` - Schéma de base de données complet
- `dev.db` - Base SQLite générée automatiquement
- `/migrations` - Historique des migrations

### `public/` - Assets Statiques

Folder pour les images, icônes, etc.

## ⚙️ Fichiers de Configuration

- `package.json` - Dépendances npm et scripts
- `tsconfig.json` - Configuration TypeScript
- `next.config.js` - Configuration Next.js
- `tailwind.config.js` - Configuration Tailwind CSS
- `postcss.config.js` - Configuration PostCSS
- `.env` - Variables d'environnement (local)
- `.env.example` - Template des variables d'environnement
- `.gitignore` - Fichiers à ignorer du git

## 🚀 Commandes Principales

```bash
# Installation
npm install

# Développement
npm run dev              # Serveur dev sur :3000 ou :3001

# Production
npm run build           # Compiler l'application
npm start              # Lancer en production

# Lint et qualité
npm run lint           # Vérifier le code

# Base de données
npm run prisma:generate    # Générer client Prisma
npm run prisma:migrate     # Créer/appliquer migrations
npx prisma studio        # Explorer la DB avec Studio
```

## 📊 Modèles de Données

### Projet
```javascript
{
  id: String (unique),
  libelle: String,
  description: String?,
  statut: String (Démarrage|En cours|Terminé|Réceptionné|Clôturé),
  chefProjetId: String,
  dateCreation: DateTime,
  chefProjet: PersonneRessource (relation),
  equipeProjet: PersonneRessource[] (relation),
  taches: Tâche[] (relation)
}
```

### Tâche
```javascript
{
  id: String (unique),
  projetId: String,
  libelle: String,
  description: String?,
  priorite: String (Haute|Moyenne|Basse),
  assigneAId: String?,
  statut: String (Backlog|A faire|En cours|...|Validé),
  dateCreation: DateTime,
  dateDebutPrevisionnelle: DateTime?,
  dateDebutEffective: DateTime?,
  dateFinPrevisionnelle: DateTime?,
  dateFinEffective: DateTime?
}
```

### PersonneRessource
```javascript
{
  id: String (unique),
  nom: String,
  prenoms: String,
  email: String (unique),
  fonction: String,
  telephone: String?,
  entiteId: String,
  estChefProjet: Boolean,
  dateCreation: DateTime
}
```

### Entité
```javascript
{
  id: String (unique),
  libelle: String,
  tutelle: String?
}
```

## 🎨 Design Tokens

### Couleurs (Tailwind Classes)
- Primaire: `text-primary` / `bg-primary` → #0f5362
- Secondaire: `text-secondary` / `bg-secondary` → #2a9d8f
- Accent: `text-accent` / `bg-accent` → #e9c46a
- Danger: `text-danger` / `bg-danger` → #d62828

### Classes Réutilisables
- Bouton primaire: `bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg`
- Shadow: `shadow-md`, `shadow-lg`
- Rounded: `rounded-lg`, `rounded-full`

## 🔗 Navigation Multi-Pages

```
/                           (Accueil)
├── /tableau-de-bord        (Dashboard global)
├── /projets                (Liste projets)
│   ├── /projets/[id]       (Détail + Kanban)
│   ├── /projets/[id]/gantt (Diagramme Gantt)
├── /entites                (Gestion entités)
└── /personnes              (Gestion personnes)
```

## 📡 Architecture API

### Format de Réponse
```json
{
  "success": true,
  "data": { /* entity */ },
  "error": null
}
```

### Erreurs Communes
- 400: Bad Request (données manquantes)
- 404: Not Found (entité inexistante)
- 500: Server Error

## 🧪 Tests Manuels Recommandés

1. Créer entité → Créer personne → Créer projet
2. Créer tâche → Assigner personne → Vérifier équipe auto
3. Changer statut tâche → Vérifier dates effectives
4. Voir Gantt → Voir Dashboard → Filtrer

## 📱 Responsive Design

- Mobile-first avec Tailwind
- Grid layouts responsive
- Breakpoints: sm, md, lg
- Navigation adaptative

## 🔐 Sécurité (V2)

- ✅ TypeScript strict
- ⏳ À ajouter: Authentication
- ⏳ À ajouter: Authorization by role
- ⏳ À ajouter: SQL injection protection
- ⏳ À ajouter: Input validation

## 🎯 Quick Links

- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/)

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-17  
**Status:** Production Ready V1 ✅
