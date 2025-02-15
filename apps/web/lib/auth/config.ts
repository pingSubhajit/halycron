import { type AuthConfig } from '@better-auth/core';
import { argon2id } from '@node-rs/argon2';
import { z } from 'zod';
import zxcvbn from 'zxcvbn';

export const authConfig: AuthConfig = {
  passwordHashing: {
    hash: async (password: string) => {
      return argon2id.hash(password, {
        timeCost: 3,
        memoryCost: 65536,
        parallelism: 4,
        saltLength: 32,
      });
    },
    verify: async (hash: string, password: string) => {
      return argon2id.verify(hash, password);
    },
  },
  
  passwordValidation: {
    validator: (password: string) => {
      const passwordSchema = z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

      const validation = passwordSchema.safeParse(password);
      const strength = zxcvbn(password);

      return {
        isValid: validation.success && strength.score >= 3,
        score: strength.score,
        feedback: validation.success ? strength.feedback : { 
          warning: validation.error.errors[0].message,
          suggestions: []
        }
      };
    }
  },

  session: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      accessToken: {
        expiresIn: '15m',
      },
      refreshToken: {
        expiresIn: '7d',
      },
    },
    maxConcurrentSessions: 5,
    inactivityTimeout: 30 * 60, // 30 minutes in seconds
  },

  mfa: {
    totp: {
      issuer: 'Halyon',
      algorithm: 'sha256',
      digits: 6,
      period: 30,
      window: 1,
    },
    required: true,
  },

  rateLimiting: {
    login: {
      points: 10,
      duration: 60, // 1 minute
      blockDuration: 300, // 5 minutes
    },
    passwordReset: {
      points: 2,
      duration: 60,
      blockDuration: 3600, // 1 hour
    },
  },

  passwordHistory: {
    size: 5, // Remember last 5 passwords
    maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
  },
} 