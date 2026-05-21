# QuickStart Guide

## 🚀 Démarrer en 5 minutes

### 1. Installation
```bash
npm install
```

### 2. Lancer le serveur
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📝 Premiers Pas

### Étape 1: Créer une Entité
1. Allez à `/entites`
2. Cliquez sur "+ Nouvelle entité"
3. Entrez "Direction Générale" par exemple
4. Cliquez "Créer"

### Étape 2: Créer une Personne Ressource
1. Allez à `/personnes`
2. Cliquez sur "+ Nouvelle personne"
3. Remplissez:
   - Nom: Dupont
   - Prénoms: Jean
   - Email: jean.dupont@example.com
   - Fonction: Chef de Projet
   - Entité: Direction Générale (créée à l'étape 1)
4. Cliquez "Créer"

### Étape 3: Créer un Projet
1. Allez à `/projets`
2. Cliquez sur "+ Nouveau projet"
3. Remplissez:
   - Libellé: "Projet Digitalisation"
   - Description: "Transformation numérique de l'entreprise"
   - Chef de projet: Jean Dupont
4. Cliquez "Créer"

### Étape 4: Créer et Gérer des Tâches
1. Cliquez sur le projet créé
2. Cliquez sur "+ Nouvelle tâche"
3. Remplissez:
   - Libellé: "Installation serveur"
   - Priorité: Haute
   - Date fin prévisionnelle: Demain
4. Cliquez "Créer"
5. La tâche apparaît en colonne "Backlog"

### Étape 5: Assigner et Suivre
1. Assignez la tâche à une personne (depuis le détail de la tâche)
2. La tâche passe en "À faire"
3. Cliquez sur "Suivant →" pour changer le statut
4. Observez les dates effectives se remplir

### Étape 6: Visualiser le Planning
1. Allez à `/projets/[id]/gantt`
2. Voyez le diagramme de Gantt
3. Retournez au Kanban pour gérer les tâches

### Étape 7: Consulter le Dashboard
1. Allez à `/tableau-de-bord`
2. Voyez les KPIs globaux
3. Filtrez par projet ou statut
4. Consultez la vélocité

---

## 🎯 Cas d'Usage Courants

### Changer le statut d'une tâche
1. Allez dans le projet
2. Trouvez la tâche sur le Kanban
3. Cliquez "Suivant →" ou déplacez-la

### Ajouter une personne à l'équipe
- **Automatiquement**: Assignez une tâche à la personne
- **Manuellement**: Éditez le projet (V2)

### Voir l'avancement d'un projet
1. Allez au dashboard
2. Regardez la "Synthèse par projet"
3. Consultez la "Vélocité"

### Gérer le calendrier
1. Allez à `/projets/[id]/gantt`
2. Voyez toutes les tâches sur timeline
3. Identifiez les chevauchements

---

## 📚 Commandes Utiles

```bash
# Démarrer dev server
npm run dev

# Build production
npm run build

# Lancer en production
npm start

# Linter
npm run lint

# Prisma studio (explorer la DB)
npx prisma studio

# Générer le client Prisma
npm run prisma:generate

# Nouvelle migration
npm run prisma:migrate

# Réinitialiser la base (ATTENTION!)
npx prisma migrate reset
```

---

## 🗂️ Fichiers Importants

- `prisma/schema.prisma` - Schéma de données
- `app/page.tsx` - Page d'accueil
- `app/tableau-de-bord/page.tsx` - Dashboard
- `components/Navigation.tsx` - Navigation principale
- `lib/prisma.ts` - Configuration Prisma

---

## 🐛 Dépannage

### Port 3000 est occupé?
Le serveur utilise le port 3001 automatiquement. Ouvrez `http://localhost:3001`

### Erreurs Prisma?
```bash
npm run prisma:generate
```

### Base de données corrompue?
```bash
npx prisma migrate reset
```

### Dépendances manquantes?
```bash
npm install
npm run prisma:generate
```

---

## 💡 Tips

- Les tâches commencent toujours en **Backlog**
- L'assignation à une personne les met en **À faire**
- Les dates de fin effective se remplissent automatiquement
- L'équipe projet se construit dynamiquement par assignation
- Le dashboard agrège tous les projets et tâches

---

**Bon travail! Vous êtes prêt à utiliser PAPE-D Project Tracker! 🎉**
