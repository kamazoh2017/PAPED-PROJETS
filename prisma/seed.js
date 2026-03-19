const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '0123456789';
const SUPER_ADMIN_LOGIN = 'super@super';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const result = await prisma.compteAcces.upsert({
    where: { login: SUPER_ADMIN_LOGIN },
    update: {
      estSuperAdmin: true,
      estActif: true,
      login: SUPER_ADMIN_LOGIN,
    },
    create: {
      login: SUPER_ADMIN_LOGIN,
      estSuperAdmin: true,
      estActif: true,
      doitChangerMdp: false,
      motDePasseHash: hashPassword(DEFAULT_PASSWORD),
    },
    select: {
      id: true,
      login: true,
      doitChangerMdp: true,
    },
  });

  console.log(`[seed] Super admin ensured: ${result.login}`);
}

main()
  .catch((error) => {
    console.error('[seed] Error while seeding super admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
