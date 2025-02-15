import { createAuthHandlers } from '@better-auth/core';
import { authConfig } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTOTP, verifyTOTP } from '@epic-web/totp';

const handlers = createAuthHandlers({
  config: authConfig,
  db,

  // User creation with initial MFA setup
  async onUserCreation(userData) {
    const { email, hashedPassword } = userData;
    
    // Generate TOTP secret
    const totp = generateTOTP({
      algorithm: 'sha256',
      period: 30,
      digits: 6,
    });

    // Create user with MFA secret
    const user = await db.transaction(async (trx) => {
      const [user] = await trx.insert('users').values({
        email,
        password: hashedPassword,
        mfaSecret: totp.secret,
        mfaEnabled: false,
        createdAt: new Date(),
      }).returning();

      return user;
    });

    return {
      user,
      mfaSetupData: {
        secret: totp.secret,
        uri: totp.uri(`Halyon:${email}`),
      },
    };
  },

  // MFA verification
  async verifyMFA(token, user) {
    const isValid = verifyTOTP({
      token,
      secret: user.mfaSecret,
      algorithm: 'sha256',
      period: 30,
      digits: 6,
      window: 1,
    });

    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    // If this is the first verification, mark MFA as enabled
    if (!user.mfaEnabled) {
      await db.update('users')
        .set({ mfaEnabled: true })
        .where('id', '=', user.id);
    }

    return true;
  },

  // Password history check
  async checkPasswordHistory(userId, newPassword) {
    const recentPasswords = await db.query.passwordHistory.findMany({
      where: (ph, { eq, and, gt }) => and(
        eq(ph.userId, userId),
        gt(ph.createdAt, new Date(Date.now() - authConfig.passwordHistory.maxAge * 1000))
      ),
      orderBy: (ph, { desc }) => [desc(ph.createdAt)],
      limit: authConfig.passwordHistory.size,
    });

    for (const { password } of recentPasswords) {
      if (await authConfig.passwordHashing.verify(password, newPassword)) {
        throw new Error('Password has been used recently');
      }
    }

    return true;
  },

  // Session management
  async onSessionCreated(session) {
    const activeSessions = await db.query.sessions.findMany({
      where: (s, { eq }) => eq(s.userId, session.userId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    if (activeSessions.length > authConfig.session.maxConcurrentSessions) {
      // Remove oldest sessions
      const sessionsToRemove = activeSessions.slice(authConfig.session.maxConcurrentSessions - 1);
      await db.delete('sessions')
        .where('id', 'in', sessionsToRemove.map(s => s.id));
    }
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE; 