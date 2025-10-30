import { User as PrismaUser } from '@prisma/client';

export class User implements Omit<PrismaUser, 'passwordHash'> {
  id: number;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  lastLoginAt: Date | null;
  passwordExpiresAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  sessionToken: string | null;
  sessionExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  emailVerificationToken: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  employeeId: number | null;
}
