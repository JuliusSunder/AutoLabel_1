/**
 * Desktop App Login Endpoint
 * POST /api/auth/app/login
 * Authenticates user with email/password and registers device
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpiryDate,
} from '@/app/lib/jwt';
import { registerDevice } from '@/app/lib/auth-middleware';

// Rate limiting map (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(email);

  if (!attempt || now > attempt.resetAt) {
    // Reset or create new entry
    loginAttempts.set(email, { count: 1, resetAt: now + 60000 }); // 1 minute
    return true;
  }

  if (attempt.count >= 5) {
    return false; // Rate limit exceeded
  }

  attempt.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, deviceId, deviceName } = body;

    // Validate input
    if (!email || !password || !deviceId) {
      return NextResponse.json(
        { error: 'Email, Passwort und Device-ID sind erforderlich' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Zu viele Login-Versuche. Bitte warten Sie eine Minute.' },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige Email oder Passwort' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Ungültige Email oder Passwort' },
        { status: 401 }
      );
    }

    // Register or update device
    const deviceResult = await registerDevice(user.id, deviceId, deviceName);
    if (!deviceResult.success) {
      return NextResponse.json(
        { error: deviceResult.error || 'Fehler beim Registrieren des Geräts' },
        { status: 403 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      deviceId,
      email: user.email,
    });

    const refreshTokenValue = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiryDate();

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        deviceId,
        token: refreshTokenValue,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Get subscription info
    const subscription = user.subscriptions[0];
    const subscriptionInfo = subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          expiresAt: subscription.currentPeriodEnd?.toISOString() || null,
        }
      : {
          plan: 'free',
          status: 'active',
          expiresAt: null,
        };

    // Return success response
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: getAccessTokenExpirySeconds(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: subscriptionInfo,
      deviceId,
    });
  } catch (error) {
    console.error('[App Login] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

