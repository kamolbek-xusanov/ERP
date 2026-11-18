import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Admin va ustoz o'quvchining login/parolini ko'ra olishi uchun parol shifrlangan (AES-256-GCM) holda saqlanadi.
 * Kalit: CREDENTIAL_KEY (bo'lmasa JWT_ACCESS_SECRET). Foydalanuvchi parolini o'zi o'zgartirsa, bu qiymat o'chadi.
 */
const key = () => createHash('sha256').update(process.env.CREDENTIAL_KEY || process.env.JWT_ACCESS_SECRET || 'skillsup-dev-key').digest();

export function sealPassword(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function openPassword(sealed?: string | null): string | null {
  if (!sealed) return null;
  try {
    const [iv, tag, enc] = sealed.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
