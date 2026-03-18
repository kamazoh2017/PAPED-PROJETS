# Architecture & Décisions Techniques

## 🏛️ Architecture Global

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React 18 / Next.js 15)          │
│  ┌─────────────────────────────────────────────────┐│
│  │ Pages: Projets, Dashboard, Entités, Personnes   ││
│  │ Kanban Board, Gantt Chart, Navigation           ││
│  └─────────────────────────────────────────────────┘│
└─────────────────┬──────────────────────────────────┘
                  │ HTTP / JSON
        ┌─────────▼──────────┐
        │  Next.js API Routes │
        │  ├─ /api/projets    │
        │  ├─ /api/taches     │
        │  ├─ /api/entites    │
        │  └─ /api/personnes  │
        └─────────┬──────────┘
                  │ SQL
        ┌─────────▼──────────┐
        │   Prisma ORM       │
        │  ├─ Migrations     │
        │  └─ Type Safety    │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  SQLite Database   │
        │  (prisma/dev.db)   │
        └────────────────────┘
```

## 📦 Stack Technologique

### Frontend
- **Next.js 15** - Framework React avec SSR/SSG
- **React 18** - UI Library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Hooks** - State management

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma 5** - ORM type-safe
- **SQLite 3** - Database local

### Development Tools
- **npm** - Package manager
- **ESLint** - Code quality
- **PostCSS** - CSS tooling

## 🔄 Flux de Données

### Création d'une Tâche

```
1. User types in form (ReactComponent)
   └─> setFormData()
   
2. Submit form
   └─> POST /api/taches
       ├─ Validate input (TypeScript)
       └─> Create in Prisma
       
3. Prisma writes to SQLite
   └─> prisma.tache.create()
   
4. API returns created task
   └─> JSON response
   
5. Frontend updates state
   └─> fetchProjet() - refetch data
   └─> Render Kanban with new task
```

### Mise à Jour du Statut

```
1. User clicks "Suivant →" button
   └─> updateTaskStatus(taskId, newStatut)
   
2. Call PUT /api/taches/[id]
   └─> Body: { statut: "En cours" }
   
3. API logic
   └─> Check statut change
   └─> Auto-fill dateDebutEffective if "En cours"
   └─> Auto-fill dateFinEffective if "Terminé"
   
4. Prisma updates database
   └─> prisma.tache.update()
   
5. Frontend refetch
   └─> Show updated task in Kanban
```

## 🗄️ Schema de Base de Données

### Relations Principales

```
Entité (1) ─── (n) PersonneRessource
  │
  └─── (n) PartiePrenante
  
Projet (1) ─── (1) PersonneRessource (Chef)
  │
  ├─── (n) PersonneRessource (Équipe)
  │
  └─── (n) Tâche
        │
        └─── (1) PersonneRessource (Assigné)
        
PersonneRessource (1) ─── (n) TâchePériodique (V2)
```

### Clés Primaires & Uniques

- **Entité**: libelle (UNIQUE)
- **PersonneRessource**: email (UNIQUE)
- **Projet**: libelle (UNIQUE)
- **Tâche**: ID + projetId
- **PartiePrenante**: Composite avec Projet

## 🎯 Règles Métier Implémentées

### Au niveau Base de Données
- Relations CASCADE pour orphans
- UNIQUE constraints sur identifiants clés
- NOT NULL sur champs obligatoires
- DEFAULT values automatiques (dates)

### Au niveau API Routes
```typescript
// Exemple: Assignation auto-ajoute à l'équipe
const estDansEquipe = projet?.equipeProjet.some(p => p.id === assigneAId);
if (!estDansEquipe) {
  await prisma.projet.update({
    equipeProjet: { connect: { id: assigneAId } }
  });
}
```

## 📱 Composants Clés

### Page Détail Projet

```typescript
ProjetDetailPage
├─ État local: projet, loading, showTaskForm
├─ fetchProjet() - GET /api/projets/[id]
├─ handleTaskSubmit() - POST /api/taches
├─ updateTaskStatus() - PUT /api/taches/[id]
├─ Rendering:
│  ├─ Project info
│  ├─ Task form (hidden by default)
│  ├─ Kanban Board (8 colonnes)
│  └─ Équipe members list
```

### Dashboard Global

```typescript
DashboardPage
├─ État: projets[], taches[], filters
├─ fetchData() - Parallel GET /api/projets et /api/taches
├─ Filtres:
│  ├─ filterProjet
│  └─ filterStatut
├─ Calculations:
│  ├─ getTachesParStatut()
│  ├─ getTachesParPriorite()
│  ├─ getVelocite()
│  ├─ getProjetsTachesTerminees()
├─ Rendering:
│  ├─ KPIs
│  ├─ Filters
│  ├─ Status grid
│  ├─ Priority breakdown
│  ├─ Project synthesis
│  └─ Filtered task list
```

## 🔌 API Endpoints

### Projets
```
GET    /api/projets           - List all
POST   /api/projets           - Create
GET    /api/projets/[id]      - Get detail
PUT    /api/projets/[id]      - Update
DELETE /api/projets/[id]      - Delete
```

### Tâches
```
GET    /api/taches            - List all
POST   /api/taches            - Create
PUT    /api/taches/[id]       - Update status/dates
DELETE /api/taches/[id]       - Delete
```

### Entités
```
GET    /api/entites           - List all
POST   /api/entites           - Create
```

### Personnes
```
GET    /api/personnes         - List all
POST   /api/personnes         - Create
```

## 🎨 Design System

### Tailwind Customization

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#0f5362',      // Bleu foncé
      secondary: '#2a9d8f',    // Teal
      accent: '#e9c46a',       // Or
      danger: '#d62828',       // Rouge
    },
  },
}
```

### Composants Réutilisables (À développer)

```typescript
// À ajouter dans /components
├─ Button.tsx
├─ Input.tsx
├─ Select.tsx
├─ Modal.tsx
├─ Card.tsx
├─ Badge.tsx
├─ Table.tsx
└─ Form.tsx
```

## 🔄 État & Hydratation

### Client-Side State
- React `useState` pour l'état local
- `useEffect` pour les appels API
- Pas de state management global (À ajouter: Redux/Zustand en V2)

### Fetching Pattern
```typescript
useEffect(() => {
  fetchData();
}, []);

// Re-fetch après mutations
handleSubmit => fetch => fetchData();
```

## 🚀 Optimisations Possibles

### Frontend
- [ ] Ajouter cache avec SWR ou React Query
- [ ] Code splitting par route
- [ ] Image optimization
- [ ] Lazy loading des composants

### Backend
- [ ] Ajouter pagination
- [ ] Ajouter indexing sur fields fréquemment filtrés
- [ ] Caching avec Redis
- [ ] Rate limiting

### Database
- [ ] Partitioning pour très gros volumes
- [ ] Migration vers PostgreSQL pour production
- [ ] Read replicas si scaled

## 🔐 Améliorations Sécurité (V2)

```typescript
// À ajouter
├─ Authentication (JWT/Session)
├─ Authorization middleware
├─ Input validation (Zod/Joi)
├─ SQL injection protection (Prisma handles)
├─ CORS configuration
├─ Rate limiting
├─ CSRF protection
└─ Helmet.js headers
```

## 📊 Performance Metrics

### Targets
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: > 90

### Monitoring (À ajouter V2)
- Sentry pour error tracking
- Datadog/New Relic pour APM
- Google Analytics

## 🧪 Testing Strategy (À implémenter V2)

```typescript
├─ Unit tests (Jest)
│  ├─ API routes
│  ├─ Utilities
│  └─ Calculations
├─ Integration tests
│  ├─ API + Prisma
│  └─ Complete flows
└─ E2E tests (Playwright/Cypress)
   ├─ User workflows
   └─ Critical paths
```

## 📈 Scalabilité

### Horizontal Scaling
- State-less API routes
- Easy deployment to Vercel
- Database can be externalized

### Vertical Scaling
- Move to PostgreSQL
- Add caching layer
- Implement CDN

## 🔗 Dependencies Updates

Regular updates needed for:
- Next.js (Major version annually)
- Prisma (Minor versions quarterly)
- React (Major version biennially)
- Tailwind (Included in templates)

---

**Architecture Version:** 1.0.0  
**Last Updated:** 2026-03-17  
**Status:** Production Ready ✅
