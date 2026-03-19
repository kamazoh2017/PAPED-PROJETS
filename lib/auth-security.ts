import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export const DEFAULT_PASSWORD = '0123456789';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, originalHash] = passwordHash.split(':');
  if (!salt || !originalHash) return false;

  const hashBuffer = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');
  const originalBuffer = Buffer.from(originalHash, 'hex');
  if (hashBuffer.length !== originalBuffer.length) return false;

  return timingSafeEqual(hashBuffer, originalBuffer);
}

export function generateSessionToken(): string {
  return randomBytes(48).toString('hex');
}
