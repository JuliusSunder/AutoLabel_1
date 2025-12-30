/**
 * Desktop App Token Refresh Endpoint
 * POST /api/auth/app/refresh
 * Refreshes access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpiryDate,
} from '@/app/lib/jwt';

// Rate limiting map
const refreshAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const attempt = refreshAttempts.get(token);

  if (!attempt || now > attempt.resetAt) {
    refreshAttempts.set(token, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (attempt.count >= 10) {
    return false;
  }

  attempt.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh Token ist erforderlich' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(refreshToken)) {
      return NextResponse.json(
        { error: 'Zu viele Refresh-Versuche' },
        { status: 429 }
      );
    }

    // Find refresh token in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Ungültiger Refresh Token' },
        { status: 401 }
      );
    }

    // Check if token is already used
    if (tokenRecord.used) {
      return NextResponse.json(
        { error: 'Refresh Token bereits verwendet' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json(
        { error: 'Refresh Token abgelaufen' },
        { status: 401 }
      );
    }

    // Mark old token as used (token rotation)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: tokenRecord.userId,
      deviceId: tokenRecord.deviceId,
      email: tokenRecord.user.email,
    });

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenExpiry = getRefreshTokenExpiryDate();

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        deviceId: tokenRecord.deviceId,
        token: newRefreshToken,
        expiresAt: newRefreshTokenExpiry,
      },
    });

    // Get subscription info
    const subscription = tokenRecord.user.subscriptions[0];
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

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
      subscription: subscriptionInfo,
    });
  } catch (error) {
    console.error('[App Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

