# 🚀 Déploiement Guide

## Déploiement Local (Développement)

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation & Lancement
```bash
# Cloner/ouvrir le dossier
cd "PAPE-D PROJECT TRACKER"

# Installer dépendances
npm install

# Lancer le serveur de dev
npm run dev
```

Accès: `http://localhost:3000` (ou 3001)

---

## Déploiement en Production

### Option 1: Vercel (Recommandé - Gratuit/Payant)

Vercel est créé pour Next.js et supporté officiellement.

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel

# Ou via GitHub (plus facile)
# 1. Push votre code à GitHub
# 2. Connectez Vercel à GitHub
# 3. Sélectionnez le repo
# 4. Cliquez "Deploy"
```

### Option 2: Netlify (Alternativ)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

### Option 3: Docker (Self-Hosted)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t pape-d-tracker .

# Run container
docker run -p 3000:3000 -e DATABASE_URL="file:/app/prisma/dev.db" pape-d-tracker
```

---

## Configuration Production

### Variables d'Environnement

Créez `.env.production`:
```
DATABASE_URL="postgresql://user:password@host:5432/pape_d_tracker"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Migration vers PostgreSQL

Pour production, utilisez PostgreSQL:

1. Installer PostgreSQL
2. Créer une base de données
3. Copier la connection string
4. Mettre à jour `.env`
5. Lancer migration: `npm run prisma:migrate`

```bash
# Exemple connection string
DATABASE_URL="postgresql://user:password@localhost:5432/pape_d_database"
```

### Commandes Production

```bash
# Build
npm run build

# Lancer
npm start

# Avec PM2 (process manager)
pm2 start npm --name "pape-d" -- start
```

---

## Stratégie Base de Données

### Développement → Production

#### Étape 1: Développement Local
- SQLite (prisma/dev.db)
- Données de test
- Migrations locales

#### Étape 2: Staging
- PostgreSQL sur serveur staging
- Données de test
- Tester les migrations

#### Étape 3: Production
- PostgreSQL managed (AWS RDS, Heroku, etc.)
- Backup automatiques
- Monitoring

### Backup & Restore

```bash
# Backup PostgreSQL
pg_dump -U user -h host database > backup.sql

# Restore
psql -U user -h host database < backup.sql

# Backup SQLite
cp prisma/dev.db prisma/dev.db.backup
```

---

## Monitoring & Logs

### Vercel
- Dashboard automatique
- Logs en temps réel
- Performance analytics

### Self-hosted
```bash
# PM2 monitoring
pm2 logs pape-d

# Nginx logs
tail -f /var/log/nginx/access.log
```

### Services Recommandés
- **Sentry** - Error tracking
- **LogRocket** - Session replays
- **Datadog** - APM
- **New Relic** - Performance

---

## SSL/HTTPS

### Vercel
- Automatique avec certificat Let's Encrypt

### Self-hosted
```bash
# Certbot (Let's Encrypt)
sudo certbot certonly --standalone -d your-domain.com

# Nginx config
server {
  listen 443 ssl;
  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
  
  location / {
    proxy_pass http://localhost:3000;
  }
}
```

---

## Scaling Horizontal

### Avec Vercel
- Automatique - Vercel gère la scalabilité

### Avec Docker Compose
```yaml
version: '3.8'
services:
  app1:
    build: .
    ports:
      - "3001:3000"
  app2:
    build: .
    ports:
      - "3002:3000"
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

---

## CI/CD Pipeline

### GitHub Actions

Créez `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm run build
      - run: npm run lint
      - name: Deploy to Vercel
        run: npx vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Checklist Déploiement

- [ ] Tester localement `npm run build && npm start`
- [ ] Vérifier variables d'environnement `.env.production`
- [ ] Lancer migrations Prisma: `npm run prisma:migrate`
- [ ] Configurer base de données production
- [ ] Tester API routes
- [ ] Vérifier CORS si domaines différents
- [ ] Activer HTTPS
- [ ] Configurer monitoring
- [ ] Backup base de données
- [ ] Tester restoration de backup
- [ ] Documenter les credentials
- [ ] Configurer alertes

---

## Troubleshooting Déploiement

### Erreur: DATABASE_URL not found
```bash
# Verifier .env.production existe
# Vérifier variable est set sur platform
```

### Erreur: Migration failed
```bash
# Vérifier connection string
# Vérifier base de données existe
# Vérifier permissions utilisateur
```

### Erreur: Port déjà utilisé
```bash
# Lancer sur port différent
PORT=3001 npm start
```

### Eorr: Deploy fails with timeout
- Aumentar timeout builder
- Réduire taille build
- Utiliser CDN pour assets

---

## Rollback

### Vercel
- Cliquer "Rollback" dans dashboard

### Self-hosted
```bash
# Git revert
git revert HEAD
git push

# Ou rélancer version précédente
pm2 restart pape-d
```

---

## Performance Tips

1. **Images**: Optimiser avec Next.js Image component
2. **Code splitting**: Automatique avec Next.js
3. **Caching**: Configurer Cache-Control headers
4. **Database**: Ajouter index sur fields fréquents
5. **CDN**: Servir assets via CloudFlare

---

## Sécurité

- ✅ HTTPS/TLS
- ✅ Prisma protection SQL injection
- ✅ Environment variables secrets
- ✅ CORS configuré
- ⏳ Authentication (V2)
- ⏳ Input validation (V2)
- ⏳ Rate limiting (V2)

---

## Support

- Vercel Support: https://vercel.com/support
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** 2026-03-17
