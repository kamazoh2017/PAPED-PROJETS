/**
 * Script de build pour l'hébergeur (MySQL)
 * Utilise prisma/mysql/schema.prisma comme source.
 *
 * Exécution : node scripts/hebergeur-build.js
 * Ou via npm : npm run hebergeur:build
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
    console.error('[hebergeur:build] ERREUR : variable DATABASE_URL non définie.');
    console.error('  Exemple : DATABASE_URL="mysql://user:pass@host:3306/dbname" node scripts/hebergeur-build.js');
    process.exit(1);
  }

  if (!/^mysql:\/\//i.test(dbUrl)) {
    console.warn('[hebergeur:build] ATTENTION : DATABASE_URL ne commence pas par mysql://');
    console.warn('  URL détectée :', dbUrl.replace(/:\/\/[^@]+@/, '://***@'));
  }

  console.log('[hebergeur:build] Génération du client Prisma (MySQL)...');
  run(`npx prisma generate --schema "${mysqlSchema}"`);

  // ── Le code applicatif importe @prisma/client (par défaut). Ce dernier
  //    pointe vers node_modules/.prisma/client, qui a été généré depuis
  //    prisma/schema.prisma (provider SQLite) → incompatible avec MySQL.
  //    On remplace donc le client par défaut par le client MySQL fraîchement
  //    généré dans node_modules/.prisma/client-mysql.
  const mysqlClientDir   = path.join(rootDir, 'node_modules', '.prisma', 'client-mysql');
  const defaultClientDir = path.join(rootDir, 'node_modules', '.prisma', 'client');

  if (fs.existsSync(mysqlClientDir)) {
    console.log('[hebergeur:build] Remplacement de @prisma/client par le client MySQL...');
    if (fs.existsSync(defaultClientDir)) {
      fs.rmSync(defaultClientDir, { recursive: true, force: true });
    }
    fs.cpSync(mysqlClientDir, defaultClientDir, { recursive: true });
  } else {
    console.warn('[hebergeur:build] ATTENTION : client MySQL introuvable à', mysqlClientDir);
  }

  console.log('[hebergeur:build] Build Next.js...');
  run('npx next build');

  console.log('\n[hebergeur:build] Build terminé avec succès.');
}

main();
