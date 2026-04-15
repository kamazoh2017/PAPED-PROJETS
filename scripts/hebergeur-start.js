/**
 * Script de démarrage pour l'hébergeur (MySQL)
 * Applique les migrations Prisma MySQL puis lance Next.js.
 *
 * Exécution : node scripts/hebergeur-start.js
 * Ou via PM2 : voir ecosystem.config.js
 */

const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const mysqlSchema = path.join(rootDir, 'prisma', 'mysql', 'schema.prisma');

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
