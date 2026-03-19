import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
    datasourceUrl: `file:${dbPath}`,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
