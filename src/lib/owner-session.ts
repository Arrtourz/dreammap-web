import 'server-only';

import { randomBytes } from 'crypto';

export const OWNER_COOKIE_NAME = 'dreammap_owner';
const OWNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function createOwnerSeed() {
  return randomBytes(16).toString('hex');
}

export function createOwnerEmail(seed: string) {
  return `owner-${seed}@dreammap.local`;
}

export function getOwnerCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OWNER_COOKIE_MAX_AGE,
  };
}
