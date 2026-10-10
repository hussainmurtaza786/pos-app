import type { AuthUser } from '@/auth/user';

// Temporary client demo session. This is deliberately not a real API JWT.
export const DEMO_TOKEN = 'pos-client-demo-v1';
export const DEMO_EMAIL = 'idreesmufaddal@gmail.com';
export function demoLogin(email: string, password: string) {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== 'idrees123456') return null;
  const now = new Date().toISOString();
  const userDetails: AuthUser = {
    id: 'client-demo', email: DEMO_EMAIL, phone: null, userRole: 'Staff',
    createdAt: now, updatedAt: null, isActive: true,
    banType: null, banReason: null, bannedAt: null, bannedBy: null, lastLoginAt: now,
  };
  return { token: DEMO_TOKEN, userDetails };
}
