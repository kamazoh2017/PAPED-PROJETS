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
  const existing = await prisma.compteAcces.findUnique({
    where: { login: SUPER_ADMIN_LOGIN },
    select: { id: true },
  });

  if (existing) {
    await prisma.compteAcces.update({
      where: { id: existing.id },
      data: {
        estSuperAdmin: true,
        estActif: true,
        login: SUPER_ADMIN_LOGIN,
      },
    });

    console.log(`[seed] Super admin already exists: ${SUPER_ADMIN_LOGIN}`);
    return;
  }

  await prisma.compteAcces.create({
    data: {
      login: SUPER_ADMIN_LOGIN,
      estSuperAdmin: true,
      estActif: true,
      doitChangerMdp: false,
      motDePasseHash: hashPassword(DEFAULT_PASSWORD),
    },
  });

  console.log(`[seed] Super admin created: ${SUPER_ADMIN_LOGIN}`);
}

main()
  .catch((error) => {
    console.error('[seed] Error while seeding super admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
