/**
 * Script de build pour l'hébergeur (MySQL)
 * Utilise prisma/mysql/schema.prisma comme source.
 *
 * Exécution : node scripts/hebergeur-build.js
 * Ou via npm : npm run hebergeur:build
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

  console.log('[hebergeur:build] Build Next.js...');
  run('npx next build');

  console.log('\n[hebergeur:build] Build terminé avec succès.');
}

main();
