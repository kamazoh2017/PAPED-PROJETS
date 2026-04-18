/**
 * Script de démarrage pour l'hébergeur (MySQL)
 * Applique les migrations Prisma MySQL puis lance Next.js.
 *
 * Exécution : node scripts/hebergeur-start.js
 * Ou via PM2 : voir ecosystem.config.js
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const mysqlSchema = path.join(rootDir, 'prisma', 'mysql', 'schema.prisma');

const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  try {
    require('dotenv').config({ path: envFile });
    console.log(`[hebergeur:start] .env chargé depuis ${envFile}`);
  } catch (_) {
    const raw = fs.readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    }
    console.log(`[hebergeur:start] .env chargé (parser interne) depuis ${envFile}`);
  }
}

function run(command) {
  console.log(`\n> ${command}`);
  const result = spawnSync(command, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const dbUrl = process.env.DATABASE_URL || '';

  if (!dbUrl) {
    console.error('[hebergeur:start] ERREUR : variable DATABASE_URL non définie.');
    process.exit(1);
  }

  console.log('[hebergeur:start] Application des migrations MySQL...');
  run(`npx prisma migrate deploy --schema "${mysqlSchema}"`);

  const port = process.env.PORT || 3000;
  console.log(`[hebergeur:start] Démarrage de Next.js sur le port ${port}...`);
  run(`npx next start -p ${port}`);
}

main();
