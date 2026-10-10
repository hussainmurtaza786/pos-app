import type { User } from '@prisma/client';

export type AuthUser = Omit<User, 'password' | 'createdAt' | 'updatedAt' | 'bannedAt' | 'lastLoginAt'> & {
  createdAt: string;
  updatedAt: string | null;
  bannedAt: string | null;
  lastLoginAt: string | null;
};

export function serializeAuthUser(user: Omit<User, 'password'> | AuthUser): AuthUser {
  const dateString = (value: Date | string | null) => value instanceof Date ? value.toISOString() : value;
  return {
    ...user,
    createdAt: dateString(user.createdAt)!,
    updatedAt: dateString(user.updatedAt),
    bannedAt: dateString(user.bannedAt),
    lastLoginAt: dateString(user.lastLoginAt),
  };
}
