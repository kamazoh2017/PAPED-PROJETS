const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
const tempSchemaPath = path.join(rootDir, 'prisma', 'schema.railway.prisma');
const generatedClientPath = path.join(rootDir, 'node_modules', '.prisma', 'client', 'index.js');
const databaseUrl = process.env.DATABASE_URL || '';
const isPostgresUrl = /^postgres(ql)?:\/\//i.test(databaseUrl);

function run(command) {
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

function getBuildSchemaPath() {
  if (!isPostgresUrl) {
    return schemaPath;
  }

  const originalSchema = fs.readFileSync(schemaPath, 'utf8');
  const patchedSchema = originalSchema.replace('provider = "sqlite"', 'provider = "postgresql"');

  if (patchedSchema === originalSchema) {
    throw new Error('Unable to patch Prisma schema provider for PostgreSQL build.');
  }

  fs.writeFileSync(tempSchemaPath, patchedSchema);
  return tempSchemaPath;
}

function cleanupTempSchema() {
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
}

function shouldGenerateClient() {
  return isPostgresUrl || !fs.existsSync(generatedClientPath) || process.env.FORCE_PRISMA_GENERATE === '1';
}

function main() {
  const buildSchemaPath = getBuildSchemaPath();
  const quotedSchemaPath = `"${buildSchemaPath}"`;

  try {
    if (shouldGenerateClient()) {
      run(`npx prisma generate --schema ${quotedSchemaPath}`);
    } else {
      console.log('[build] Reusing existing Prisma client for local SQLite build.');
    }

    if (isPostgresUrl) {
      console.log('[build] PostgreSQL deployment detected. Running idempotent db push and seed.');
      run(`npx prisma db push --schema ${quotedSchemaPath}`);
      run('npx prisma db seed');
    } else {
      console.log('[build] Local/SQLite build detected. Skipping deployment database push and seed.');
    }

    run('npx next build');
  } finally {
    cleanupTempSchema();
  }
}

main();
