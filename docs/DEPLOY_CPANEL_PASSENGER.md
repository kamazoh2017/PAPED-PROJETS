# Guide de déploiement cPanel + Phusion Passenger + GitHub Actions

> **À l'IA qui lit ce document** : ce fichier est un playbook autonome de déploiement. Tu **dois** d'abord collecter toutes les variables marquées `<…>` via le formulaire de la **Section 0**, puis suivre les phases dans l'ordre. Ne saute aucune phase. Toutes les commandes sont copiables/collables après remplacement des variables.
>
> Ce guide capture l'expérience d'un déploiement réussi sur cPanel mshpcmu.ci (RHEL + Application Manager + Phusion Passenger). Il sait éviter les pièges récurrents documentés en **Section 99**.

---

## Section 0 — Inputs à collecter (PRÉ-REQUIS, à demander à l'utilisateur)

**Avant toute action**, demande à l'utilisateur les valeurs suivantes en une seule passe (formulaire ou questions groupées). Conserve-les comme tableau de variables référencé ensuite.

### 0.1 Identité du projet

| Variable | Description | Exemple |
|---|---|---|
| `<APP_NAME>` | Nom court (kebab-case) | `monapp-tracker` |
| `<REPO_URL>` | URL HTTPS du repo GitHub | `https://github.com/user/repo.git` |
| `<REPO_USER>` | Utilisateur GitHub | `user` |
| `<REPO_NAME>` | Nom du repo | `repo` |
| `<DEFAULT_BRANCH_PROD>` | Branche déployée en PROD | `master` ou `main` |
| `<DEFAULT_BRANCH_PREPROD>` | Branche déployée en PREPROD | `preprod` |
| `<STACK>` | Type de stack | Next.js / Express / autre |
| `<ORM>` | ORM utilisé | Prisma / Drizzle / autre |
| `<LOCAL_DB>` | Type de DB en dev local | SQLite / PostgreSQL / autre |

### 0.2 Hébergeur cPanel

| Variable | Description | Exemple |
|---|---|---|
| `<CPANEL_URL>` | URL cPanel | `https://server.example.com:2083` |
| `<SSH_HOST>` | Hostname/IP SSH | `vps1.example.com` |
| `<SSH_USER>` | Utilisateur cPanel SSH | `monuser` |
| `<SSH_PORT>` | Port SSH | `22` |
| `<NODE_BIN>` | Chemin du Node | `/opt/cpanel/ea-nodejs22/bin` |

### 0.3 Domaines

| Variable | Description | Exemple |
|---|---|---|
| `<DOMAIN_PROD>` | Domaine PROD | `app.example.com` |
| `<DOMAIN_PREPROD>` | Domaine PREPROD | `dev-app.example.com` |

### 0.4 Bases MySQL cPanel

| Variable | Description | Exemple |
|---|---|---|
| `<DB_PROD_NAME>` | Nom de la base PROD | `monuser_app_prod` |
| `<DB_PROD_USER>` | User MySQL PROD | `monuser_app_prod` |
| `<DB_PROD_PASS>` | Mot de passe PROD (encoder `@` → `%40`) | `P@ss` → `P%40ss` |
| `<DB_PREPROD_NAME>` | Nom de la base PREPROD | `monuser_app_preprod` |
| `<DB_PREPROD_USER>` | User MySQL PREPROD | `monuser_app_preprod` |
| `<DB_PREPROD_PASS>` | Mot de passe PREPROD | (idem encoding) |

### 0.5 Chemins serveur (auto-déduits)

| Variable | Valeur calculée |
|---|---|
| `<APP_DIR_PROD>` | `/home/<SSH_USER>/apps/<APP_NAME>` |
| `<APP_DIR_PREPROD>` | `/home/<SSH_USER>/apps/<APP_NAME>-preprod` |

### 0.6 Vérifications préalables (à faire en SSH avant de continuer)

```bash
# Système (vérifier RHEL/AlmaLinux + OpenSSL 3.x)
cat /etc/redhat-release
openssl version

# Node disponible
ls /opt/cpanel/ | grep -i nodejs
<NODE_BIN>/node --version    # attendu: v20.x ou v22.x
<NODE_BIN>/npm --version

# Application Manager présent dans cPanel ?
# → ouvrir <CPANEL_URL>/frontend/jupiter/passenger/index.html
# Si "Application Manager" → OK
# Si "Setup Node.js App" (avec ~/nodevenv/) → ce guide reste valide mais
#   ajuster le chemin de Node : utiliser `source ~/nodevenv/<APP>/<VER>/bin/activate`
```

> Si OpenSSL ≠ 3.x ou Node version ≠ 20/22, **stop** et demander à l'utilisateur quelle version il a.

---

## Section 1 — Vue d'ensemble de l'architecture cible

```
┌─────────────────────────────────────────────────────┐
│  Local dev :  <LOCAL_DB>  +  <ORM>  +  <STACK>      │
└────────────────────┬────────────────────────────────┘
                     │ git push <branch>
                     ▼
        ┌─────────────────────────┐
        │   GitHub Actions CI/CD  │
        │ deploy-hebergeur.yml    │
        └────────────┬────────────┘
                     │ SSH (appleboy/ssh-action)
                     ▼
┌─────────────────────────────────────────────────────┐
│ cPanel <SSH_HOST>                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │ Application Manager (Phusion Passenger)       │  │
│  │  ┌──────────────────┐  ┌─────────────────────┐│  │
│  │  │ <DOMAIN_PREPROD> │  │ <DOMAIN_PROD>       ││  │
│  │  │ ↓                │  │ ↓                   ││  │
│  │  │ <APP_DIR_PREPROD>│  │ <APP_DIR_PROD>      ││  │
│  │  │ → MySQL PREPROD  │  │ → MySQL PROD        ││  │
│  │  └──────────────────┘  └─────────────────────┘│  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Branches Git** :
- `<DEFAULT_BRANCH_PREPROD>` → PREPROD (auto-deploy via GitHub Actions)
- `<DEFAULT_BRANCH_PROD>` → PROD (auto-deploy via GitHub Actions)
- Toute autre branche (`dev`, feature/xxx) → pas de déploiement

---

## Section 2 — Phase A : Préparation du code

### 2.1 Configuration ORM multi-DB (si Prisma)

Si `<ORM>` = Prisma :

**Structure** :
```
prisma/
  schema.prisma              ← provider <LOCAL_DB>, pour dev
  mysql/
    schema.prisma            ← provider mysql, pour cPanel prod/preprod
    migrations/              ← migrations spécifiques MySQL
```

**`prisma/mysql/schema.prisma`** doit contenir au minimum :

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../../node_modules/.prisma/client-mysql"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]   // CRITIQUE
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ... copie tous les modèles depuis prisma/schema.prisma
// avec adaptation des types (voir Section 99 piège #2)
```

**`prisma/schema.prisma`** (local) ajoute aussi `binaryTargets = ["native", "rhel-openssl-3.0.x"]` au générateur, par symétrie.

### 2.2 Mapping des types (si conversion SQLite ou PostgreSQL → MySQL)

| Type local | Type MySQL recommandé |
|---|---|
| `String` court (libellé, code) | `String @db.VarChar(255)` |
| `String` court (mot de passe hash, token) | `String @db.VarChar(500)` |
| `String` long (description, html) | `String @db.Text` |
| `Json` / `Jsonb` | `Json` (devient LONGTEXT) |
| `String[]` (PG array) | **non supporté** → table jointure ou `Json` |
| `String @db.Uuid` (PG) | remplacer par `cuid()` ou `String @db.VarChar(36)` |
| `Float` | `Float` (devient DOUBLE) |
| `BigInt` | `BigInt` |
| `Boolean` | `Boolean` (devient TINYINT(1)) |
| `Bytes` | `Bytes` (devient LONGBLOB) |

⚠️ Pour les colonnes avec `@unique` ou index : la longueur VARCHAR doit être ≤ 255 (sinon MySQL refuse l'index).

### 2.3 Custom server `app.js` pour Passenger

À créer à la racine du projet **si la stack n'a pas déjà un point d'entrée Node compatible Passenger**.

Pour Next.js :

```javascript
const path = require('path');
const fs = require('fs');
const rootDir = __dirname;

// Charger .env (Passenger ne le fait JAMAIS automatiquement)
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  try {
    require('dotenv').config({ path: envFile });
  } catch (_) {
    const raw = fs.readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  }
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3000;
const nextApp = next({ dev: false, hostname: '127.0.0.1', port, dir: rootDir });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(port);
});
```

Pour Express : adapter en gardant **le bloc dotenv au tout début**.

### 2.4 Script `scripts/hebergeur-build.js`

```javascript
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const mysqlSchema = path.join(rootDir, 'prisma', 'mysql', 'schema.prisma');

// Charger .env (sécurité au cas où)
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  try {
    require('dotenv').config({ path: envFile });
  } catch (_) {
    const raw = fs.readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  }
}

function run(cmd) {
  const result = spawnSync(cmd, { cwd: rootDir, stdio: 'inherit', env: process.env, shell: true });
  if (result.status !== 0) process.exit(result.status || 1);
}

// 1. Generate MySQL client
run(`npx prisma generate --schema "${mysqlSchema}"`);

// 2. Replace default Prisma client by MySQL client (CRITIQUE)
const mysqlClientDir   = path.join(rootDir, 'node_modules', '.prisma', 'client-mysql');
const defaultClientDir = path.join(rootDir, 'node_modules', '.prisma', 'client');
if (fs.existsSync(mysqlClientDir)) {
  if (fs.existsSync(defaultClientDir)) fs.rmSync(defaultClientDir, { recursive: true, force: true });
  fs.cpSync(mysqlClientDir, defaultClientDir, { recursive: true });
}

// 3. Build (adapter selon la stack)
run('npx next build');
```

### 2.5 `package.json` — scripts et dépendances

**Scripts à ajouter** (adapter les noms si la stack diffère) :

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "node app.js",
  "hebergeur:build": "node scripts/hebergeur-build.js",
  "hebergeur:migrate:deploy": "prisma migrate deploy --schema prisma/mysql/schema.prisma",
  "hebergeur:generate": "prisma generate --schema prisma/mysql/schema.prisma"
}
```

**Dépendances requises en `dependencies`** (PAS dans devDependencies — voir piège #6) :
- `prisma`, `typescript`, `@types/node`, `@types/react`, `eslint`, `eslint-config-next`
- `tailwindcss`, `postcss`, `autoprefixer` (si présents)

**Vérifier qu'aucun paquet n'est dupliqué** entre `dependencies` et `devDependencies`.

### 2.6 `.gitignore` — `.env` JAMAIS tracké

```gitignore
.env
.env.local
.env.production.local
.env.development.local
.env.test.local
node_modules/
.next/
*.db
*.sqlite
prisma/dev.db
```

Si `.env` est déjà tracké :
```bash
git rm --cached .env
git commit -m "chore(gitignore): retirer .env du tracking"
```

### 2.7 `app/not-found.tsx` (si Next.js 15+)

Évite le bug `<Html> should not be imported outside of pages/_document` au prerender :

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <h1 className="text-3xl font-bold">404 — Page introuvable</h1>
      <Link href="/" className="mt-4 text-blue-600 underline">Retour à l'accueil</Link>
    </div>
  );
}
```

### 2.8 Cookie de session — flag `secure`

Si l'app pose des cookies de session avec `secure: NODE_ENV === 'production'` : c'est OK **mais l'AutoSSL HTTPS sera obligatoire** sinon le login échouera silencieusement (cookie posé mais jamais renvoyé en HTTP).

---

## Section 3 — Phase B : Workflow GitHub Actions

Créer `.github/workflows/deploy-hebergeur.yml` :

```yaml
name: Deploy — <APP_NAME>

on:
  push:
    branches:
      - <DEFAULT_BRANCH_PROD>
      - <DEFAULT_BRANCH_PREPROD>
  workflow_dispatch:
    # Aucun input — la branche choisie dans l'UI détermine la cible

jobs:
  deploy:
    name: Deploy → ${{ github.ref_name == '<DEFAULT_BRANCH_PROD>' && 'PROD' || 'PREPROD' }}
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v4

      - name: Deploy PREPROD
        if: github.ref_name == '<DEFAULT_BRANCH_PREPROD>'
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          command_timeout: 900s
          script: |
            set -e
            cd ${{ secrets.PREPROD_APP_DIR }}
            echo "── [1/6] Pull <DEFAULT_BRANCH_PREPROD> ──"
            git pull origin <DEFAULT_BRANCH_PREPROD>
            echo "── [2/6] Dépendances ──"
            <NODE_BIN>/npm ci --omit=dev
            echo "── [3/6] Prisma generate ──"
            export DATABASE_URL="${{ secrets.PREPROD_MYSQL_URL }}"
            <NODE_BIN>/npx prisma generate --schema prisma/mysql/schema.prisma
            echo "── [4/6] Migrations MySQL ──"
            <NODE_BIN>/npx prisma migrate deploy --schema prisma/mysql/schema.prisma
            echo "── [5/6] Build ──"
            <NODE_BIN>/npm run hebergeur:build
            echo "── [6/6] Restart Passenger ──"
            mkdir -p tmp && touch tmp/restart.txt
            echo "✓ PREPROD déployé — <DOMAIN_PREPROD>"

      - name: Deploy PROD
        if: github.ref_name == '<DEFAULT_BRANCH_PROD>'
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          command_timeout: 900s
          script: |
            set -e
            cd ${{ secrets.PROD_APP_DIR }}
            echo "── [1/6] Pull <DEFAULT_BRANCH_PROD> ──"
            git pull origin <DEFAULT_BRANCH_PROD>
            echo "── [2/6] Dépendances ──"
            <NODE_BIN>/npm ci --omit=dev
            echo "── [3/6] Prisma generate ──"
            export DATABASE_URL="${{ secrets.PROD_MYSQL_URL }}"
            <NODE_BIN>/npx prisma generate --schema prisma/mysql/schema.prisma
            echo "── [4/6] Migrations MySQL ──"
            <NODE_BIN>/npx prisma migrate deploy --schema prisma/mysql/schema.prisma
            echo "── [5/6] Build ──"
            <NODE_BIN>/npm run hebergeur:build
            echo "── [6/6] Restart Passenger ──"
            mkdir -p tmp && touch tmp/restart.txt
            echo "✓ PROD déployé — <DOMAIN_PROD>"
```

### 3.1 Secrets GitHub à créer

`Settings → Secrets and variables → Actions → New repository secret` :

| Secret | Valeur |
|---|---|
| `SSH_HOST` | `<SSH_HOST>` |
| `SSH_USER` | `<SSH_USER>` |
| `SSH_PORT` | `<SSH_PORT>` |
| `SSH_KEY` | clé SSH privée (cf. Phase D) |
| `PREPROD_APP_DIR` | `<APP_DIR_PREPROD>` |
| `PROD_APP_DIR` | `<APP_DIR_PROD>` |
| `PREPROD_MYSQL_URL` | `mysql://<DB_PREPROD_USER>:<DB_PREPROD_PASS>@localhost:3306/<DB_PREPROD_NAME>` |
| `PROD_MYSQL_URL` | `mysql://<DB_PROD_USER>:<DB_PROD_PASS>@localhost:3306/<DB_PROD_NAME>` |

> ⚠️ Le `@` dans le mot de passe MySQL doit être encodé `%40`. Toutes les URLs MySQL doivent être URL-encoded pour les caractères spéciaux du mot de passe.

---

## Section 4 — Phase C : Préparation serveur (en SSH)

### 4.1 Créer la clé SSH de déploiement (Deploy Key)

```bash
# Sur le serveur
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_<APP_NAME> -N "" -C "deploy@<APP_NAME>"

# Afficher la clé publique pour la copier dans GitHub
cat ~/.ssh/github_deploy_<APP_NAME>.pub
```

Ajouter cette clé publique dans **GitHub → repo Settings → Deploy keys → Add deploy key** (lecture seule, pas write).

```bash
# Configurer ~/.ssh/config pour utiliser cette clé pour ce repo uniquement
cat >> ~/.ssh/config <<EOF

Host github.com-<APP_NAME>
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy_<APP_NAME>
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# Tester
ssh -T git@github.com-<APP_NAME>
```

> Le test doit retourner : `Hi <REPO_USER>/<REPO_NAME>! You've successfully authenticated`.

### 4.2 Cloner le repo dans les deux environnements

```bash
# PREPROD
mkdir -p <APP_DIR_PREPROD>
cd <APP_DIR_PREPROD>
git clone git@github.com-<APP_NAME>:<REPO_USER>/<REPO_NAME>.git .
git checkout <DEFAULT_BRANCH_PREPROD>

# PROD
mkdir -p <APP_DIR_PROD>
cd <APP_DIR_PROD>
git clone git@github.com-<APP_NAME>:<REPO_USER>/<REPO_NAME>.git .
git checkout <DEFAULT_BRANCH_PROD>
```

### 4.3 Créer les `.env` (PAS dans git !)

```bash
# PREPROD
cat > <APP_DIR_PREPROD>/.env <<EOF
NODE_ENV=production
DATABASE_URL="mysql://<DB_PREPROD_USER>:<DB_PREPROD_PASS>@localhost:3306/<DB_PREPROD_NAME>"
EOF
chmod 600 <APP_DIR_PREPROD>/.env

# PROD
cat > <APP_DIR_PROD>/.env <<EOF
NODE_ENV=production
DATABASE_URL="mysql://<DB_PROD_USER>:<DB_PROD_PASS>@localhost:3306/<DB_PROD_NAME>"
EOF
chmod 600 <APP_DIR_PROD>/.env
```

### 4.4 Récupérer la clé privée SSH pour GitHub Actions

```bash
cat ~/.ssh/<EXISTING_KEY_OR_PASSPHRASE_LESS_KEY>
```

> Si pas encore de clé pour Actions, en créer une **autre** que la deploy key (la deploy key est read-only, GitHub Actions a besoin de SSH au serveur, pas de SSH GitHub) :
> ```bash
> ssh-keygen -t ed25519 -f ~/.ssh/gha_deploy -N "" -C "gha@<APP_NAME>"
> cat ~/.ssh/gha_deploy.pub >> ~/.ssh/authorized_keys
> chmod 600 ~/.ssh/authorized_keys
> cat ~/.ssh/gha_deploy   # → coller dans GitHub Secret SSH_KEY
> ```

### 4.5 Création des bases MySQL via cPanel UI

cPanel → **MySQL® Databases** :
1. Créer DB `<DB_PREPROD_NAME>` et DB `<DB_PROD_NAME>`
2. Créer users `<DB_PREPROD_USER>` et `<DB_PROD_USER>` avec mots de passe forts (éviter caractères qui doivent être URL-encoded ; sinon penser à l'encoding)
3. Associer chaque user à sa DB avec **ALL PRIVILEGES**

### 4.6 Enregistrement dans cPanel Application Manager

cPanel → **Application Manager** → **Register Application** :

| Champ | PREPROD | PROD |
|---|---|---|
| Domain | `<DOMAIN_PREPROD>` | `<DOMAIN_PROD>` |
| Application Path | `<APP_DIR_PREPROD>` | `<APP_DIR_PROD>` |
| Application Environment | Production | Production |
| Application Startup File | `app.js` | `app.js` |

> ⚠️ Le bouton **"Ensure Dependencies"** échoue souvent sans message clair → privilégier l'install manuelle SSH (cf. Phase E).

### 4.7 HTTPS via AutoSSL

cPanel → **SSL/TLS Status** → cocher `<DOMAIN_PREPROD>` et `<DOMAIN_PROD>` → **Run AutoSSL**.

Attendre 2-3 min jusqu'au statut vert. **Indispensable** pour les cookies sécurisés.

---

## Section 5 — Phase D : Premier déploiement (en SSH)

### 5.1 Installation des dépendances

```bash
# PREPROD
cd <APP_DIR_PREPROD>
<NODE_BIN>/npm install

# PROD
cd <APP_DIR_PROD>
<NODE_BIN>/npm install
```

> Si erreur, lire la sortie complète. Les warnings `deprecated` sont normaux. Les erreurs `EACCES` ou `ENOENT` indiquent un problème de permissions ou de Node version.

### 5.2 Génération du client Prisma + baseline (si Prisma)

```bash
cd <APP_DIR_PREPROD>
<NODE_BIN>/npx prisma generate --schema prisma/mysql/schema.prisma
```

**Premier déploiement** : si la base MySQL contient déjà des tables (créées hors Prisma), `prisma migrate deploy` lèvera **P3005**. Solution :

```bash
# Marquer la migration initiale comme déjà appliquée
<NODE_BIN>/npx prisma migrate resolve --applied 0_init --schema prisma/mysql/schema.prisma
```

Si la base est **vide**, `prisma migrate deploy` fonctionnera directement.

### 5.3 Build initial

```bash
cd <APP_DIR_PREPROD>
<NODE_BIN>/npm run hebergeur:build

# Vérifier que le client MySQL a remplacé le client par défaut :
head -12 node_modules/.prisma/client/schema.prisma | grep provider
# Doit afficher : provider = "mysql"
```

### 5.4 Démarrer / redémarrer Passenger

```bash
mkdir -p <APP_DIR_PREPROD>/tmp
touch <APP_DIR_PREPROD>/tmp/restart.txt
```

Idem pour PROD.

### 5.5 Test navigateur

- https://<DOMAIN_PREPROD>/ doit charger
- https://<DOMAIN_PROD>/ doit charger
- HTTPS doit afficher le cadenas vert (AutoSSL OK)

### 5.6 Test API spécifique (login si applicable)

```bash
# Test depuis local
curl -i -X POST https://<DOMAIN_PREPROD>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'
```

---

## Section 6 — Phase E : Migration des données locales → MySQL (si applicable)

Si la `<LOCAL_DB>` contient des données utiles à migrer vers PREPROD/PROD MySQL :

### 6.1 Stratégie

Écrire `scripts/migrate-local-to-mysql.js` qui :
1. Connecte deux instances Prisma (une client par défaut = local, une client MySQL via le custom output)
2. Pour chaque table dans l'ordre des dépendances FK : lit du local, fait `upsert` dans MySQL (idempotent)
3. Supporte un flag `--dry-run`

```javascript
// scripts/migrate-local-to-mysql.js (squelette)
const { PrismaClient } = require('@prisma/client');                  // local
const { PrismaClient: MysqlClient } = require('../node_modules/.prisma/client-mysql');

const localPrisma = new PrismaClient();
const mysqlPrisma = new MysqlClient({
  datasources: { db: { url: process.env.DATABASE_URL_TARGET } }
});

const dryRun = process.argv.includes('--dry-run');

(async () => {
  // 1. Tables racines (pas de FK sortante)
  // 2. Puis tables avec FK vers les racines
  // ... ordre à définir selon le schéma
  
  // Exemple :
  const entites = await localPrisma.entite.findMany();
  for (const e of entites) {
    if (!dryRun) await mysqlPrisma.entite.upsert({
      where: { id: e.id }, create: e, update: e
    });
  }
  
  await localPrisma.$disconnect();
  await mysqlPrisma.$disconnect();
})();
```

### 6.2 Lancement

```bash
# Sur le poste local (ou serveur peu importe)
DATABASE_URL_TARGET="mysql://<DB_PREPROD_USER>:<DB_PREPROD_PASS>@<SSH_HOST>:3306/<DB_PREPROD_NAME>" \
  node scripts/migrate-local-to-mysql.js --dry-run

# Si --dry-run OK, lancer pour de vrai
DATABASE_URL_TARGET="mysql://..." node scripts/migrate-local-to-mysql.js
```

> Pour PROD, **ne jamais migrer toutes les données locales** : démarrer avec un seed minimal (super-admin + données structurelles).

### 6.3 Backup AVANT toute manip serveur

```bash
mkdir -p ~/backups && cd ~/backups
MYSQL_PWD='<DB_PREPROD_PASS_NON_ENCODED>' mysqldump -u <DB_PREPROD_USER> --single-transaction --routines --triggers --default-character-set=utf8mb4 <DB_PREPROD_NAME> > backup_preprod_$(date +%Y%m%d_%H%M%S).sql
MYSQL_PWD='<DB_PROD_PASS_NON_ENCODED>' mysqldump -u <DB_PROD_USER> --single-transaction --routines --triggers --default-character-set=utf8mb4 <DB_PROD_NAME> > backup_prod_$(date +%Y%m%d_%H%M%S).sql
```

> Ici on utilise le mot de passe **non encodé** (pas `%40`, mais `@` brut). MySQL CLI veut le pass natif.

---

## Section 7 — Phase F : Cron jobs (si applicable)

Si l'app a des endpoints `/api/cron/...` :

### 7.1 Générer un secret

```bash
SECRET=$(openssl rand -hex 32)
echo "$SECRET"
```

### 7.2 Ajouter aux `.env` (PREPROD et PROD)

```bash
echo "CRON_SECRET=\"$SECRET\"" >> <APP_DIR_PREPROD>/.env
echo "CRON_SECRET=\"$SECRET\"" >> <APP_DIR_PROD>/.env

touch <APP_DIR_PREPROD>/tmp/restart.txt
touch <APP_DIR_PROD>/tmp/restart.txt
```

### 7.3 Configurer dans cPanel → Cron Jobs

Pour chaque endpoint, ajouter :

```bash
# Tous les jours à 02:00 — exemple PREPROD
0 2 * * * curl -s -H "Authorization: Bearer <CRON_SECRET>" https://<DOMAIN_PREPROD>/api/cron/<endpoint> > /dev/null
```

---

## Section 8 — Phase G : Workflow nominal après le 1er déploiement

```bash
# Local : développer sur dev
git checkout dev
# ... commits ...
git push origin dev

# Déployer en PREPROD
git checkout <DEFAULT_BRANCH_PREPROD>
git pull origin <DEFAULT_BRANCH_PREPROD>
git merge dev --no-edit
git push origin <DEFAULT_BRANCH_PREPROD>
# → GitHub Actions déploie automatiquement

# Tester PREPROD, puis si OK :
git checkout <DEFAULT_BRANCH_PROD>
git pull origin <DEFAULT_BRANCH_PROD>
git merge <DEFAULT_BRANCH_PREPROD> --no-edit  # ou merge dev
git push origin <DEFAULT_BRANCH_PROD>
# → GitHub Actions déploie PROD

# Revenir en dev pour continuer
git checkout dev
```

---

## Section 9 — Validation post-déploiement (checklist)

À cocher après chaque déploiement :

### PREPROD
- [ ] Workflow GitHub Actions vert sur les 6 étapes
- [ ] https://<DOMAIN_PREPROD>/ charge en HTTPS
- [ ] Login fonctionne (cookie Secure renvoyé)
- [ ] Une page lourde (dashboard, liste) affiche les bonnes données
- [ ] Création/modification d'une entité (CRUD) fonctionne
- [ ] `head -12 <APP_DIR_PREPROD>/node_modules/.prisma/client/schema.prisma | grep provider` → `provider = "mysql"`

### PROD
- [ ] Idem PREPROD
- [ ] HTTPS valide (AutoSSL vert dans cPanel)
- [ ] Aucun `500` dans les logs

### Cron (si applicable)
- [ ] `curl -i -H "Authorization: Bearer <SECRET>" https://<DOMAIN_PREPROD>/api/cron/<endpoint>` retourne 200
- [ ] Cron Jobs cPanel listés dans le bon fuseau horaire (UTC ou local — vérifier avec `date` en SSH)

---

## Section 99 — Pièges connus (LECTURE OBLIGATOIRE pour l'IA)

Tous ces pièges ont coûté des heures à diagnostiquer. Les éviter en avance fait gagner un temps précieux.

### 1. `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
**Manquant** → erreur runtime `could not locate the Query Engine for runtime "rhel-openssl-3.0.x"`. À mettre dans **les deux** schémas Prisma (local + MySQL).

### 2. Client Prisma : copie `client-mysql` → `client`
**Manquant** → l'app charge le client SQLite/PG sur une DB MySQL = crash sur les requêtes. Le script `hebergeur-build.js` doit faire cette copie après `prisma generate`.

### 3. `.env` jamais tracké par git
Sinon le `git pull` du workflow l'écrase à chaque déploiement avec la valeur du repo. Vérifier `.gitignore` AVANT le 1er push. Si déjà tracké : `git rm --cached .env`.

### 4. Cookie `Secure` + HTTP = invisible
Le cookie est posé mais jamais renvoyé par le navigateur sur HTTP. **Activer AutoSSL ASAP** ou login échouera silencieusement.

### 5. Next.js 15.5+ sans `app/not-found.tsx`
Build échoue sur prerender de `/404` avec `<Html> should not be imported outside of pages/_document`. Toujours créer un `app/not-found.tsx` minimal.

### 6. `tailwindcss` / `postcss` / `autoprefixer` mal placés
Mettre dans `dependencies`. **Ne JAMAIS** dupliquer entre `dependencies` et `devDependencies` — npm les skip silencieusement avec `--omit=dev`.

### 7. Pas de `~/nodevenv/` sur Application Manager
Le binaire Node est `<NODE_BIN>/node`. Si `~/nodevenv/` existe, c'est l'ancien "Setup Node.js App" (autre architecture).

### 8. "Ensure Dependencies" cPanel échoue silencieusement
Préférer l'install SSH manuelle avec `<NODE_BIN>/npm install`.

### 9. P3005 au 1er déploiement
DB MySQL pré-existante (pas créée par Prisma) → `prisma migrate resolve --applied <init_migration_name>` pour baseline.

### 10. Workflow GitHub Actions : pas d'input `environment` dans `workflow_dispatch`
La branche pushée détermine la cible. Évite tout doute et tout déploiement croisé.

### 11. Mots de passe MySQL avec `@`
Dans `DATABASE_URL` (URL-encoded), encoder `@` en `%40`. Dans MySQL CLI, utiliser le mot de passe brut.

### 12. Timezone serveur
`date` en SSH → généralement UTC. À prendre en compte pour les Cron Jobs.

### 13. Premier `git pull` sur le serveur après push d'un commit qui supprime `.env` du tracking
Le pull veut écraser le `.env` local serveur. Solution : `cp .env .env.backup; rm .env; git pull; recréer le .env avec les valeurs MySQL`.

### 14. `appleboy/ssh-action` : SSH sur GitHub HTTPS
Si le remote git du serveur est en HTTPS (`https://github.com/...`), `git pull` échoue car pas d'auth. Configurer le remote en SSH (cf. Phase C.4.1).

### 15. Drift Prisma migrations vs DB
Si `prisma migrate diff --from-migrations` génère des `RedefineTables` étranges, c'est que les migrations historiques ne correspondent plus à la DB réelle. Utiliser `--from-schema-datasource` à la place pour diffuser depuis la DB réelle.

---

## Section 100 — Aide-mémoire SSH

```bash
# Connexion
ssh -p <SSH_PORT> <SSH_USER>@<SSH_HOST>

# Restart Passenger
touch <APP_DIR>/tmp/restart.txt

# Logs Passenger
ls /home/<SSH_USER>/logs/<DOMAIN>*

# Lancer l'app manuellement (debug, hors Passenger)
cd <APP_DIR>
PORT=3099 <NODE_BIN>/node app.js
# Ctrl+C pour arrêter

# Tester DB MySQL
MYSQL_PWD='<PASS>' mysql -u <USER> -e "SELECT COUNT(*) FROM <table>" <DB_NAME>

# Vérifier le timezone
date && cat /etc/timezone

# Backups MySQL
MYSQL_PWD='<PASS>' mysqldump -u <USER> --single-transaction --routines --triggers --default-character-set=utf8mb4 <DB_NAME> > ~/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Plan d'action complet pour l'IA qui suit ce document

1. **Section 0** : collecter tous les inputs `<…>` auprès de l'utilisateur en une fois (formulaire/AskUserQuestion)
2. **Section 0.6** : vérifier les pré-requis serveur en SSH (RHEL, OpenSSL, Node)
3. **Section 2** : préparer le code (schemas multi-DB, app.js, hebergeur-build.js, package.json, .gitignore, not-found.tsx)
4. **Section 3** : créer le workflow GitHub Actions et les secrets
5. **Section 4** : préparer le serveur (deploy key, clone, .env, MySQL DBs, Application Manager, AutoSSL)
6. **Section 5** : 1er déploiement manuel SSH (install + build + restart)
7. **Section 6** : migration des données locales (si applicable)
8. **Section 7** : cron jobs (si applicable)
9. **Section 9** : validation post-déploiement
10. À chaque pépin : consulter **Section 99** avant de creuser plus loin

**Ne jamais** :
- Faire `prisma db push` sur PREPROD/PROD (toujours `migrate deploy`)
- Pousser un `.env` tracké
- Désactiver AutoSSL
- Modifier `binaryTargets` sans relancer un build complet
- Skipper la `Section 99` si quelque chose foire

---

**Fin du guide. Bon déploiement.**
