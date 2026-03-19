const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
const tempSchemaPath = path.join(rootDir, 'prisma', 'schema.railway.prisma');
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

function getRuntimeSchemaPath() {
  if (!isPostgresUrl) {
    return schemaPath;
  }

  const originalSchema = fs.readFileSync(schemaPath, 'utf8');
  const patchedSchema = originalSchema.replace('provider = "sqlite"', 'provider = "postgresql"');

  if (patchedSchema === originalSchema) {
    throw new Error('Unable to patch Prisma schema provider for PostgreSQL runtime.');
  }

  fs.writeFileSync(tempSchemaPath, patchedSchema);
  return tempSchemaPath;
}

function cleanupTempSchema() {
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
}

function main() {
  const runtimeSchemaPath = getRuntimeSchemaPath();
  const quotedSchemaPath = `"${runtimeSchemaPath}"`;

  try {
    if (isPostgresUrl) {
      console.log('[start] PostgreSQL runtime detected. Running idempotent db push and seed before starting app.');
      run(`npx prisma db push --schema ${quotedSchemaPath}`);
      run('npx prisma db seed');
    } else {
      console.log('[start] Local/SQLite runtime detected. Starting app without deployment db init.');
    }

    run('npx next start');
  } finally {
    cleanupTempSchema();
  }
}

main();
