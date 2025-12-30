/**
 * Desktop App Label Creation Validation Endpoint
 * POST /api/auth/app/validate-label-creation
 * Validates if user can create labels and increments usage counter
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateBearerToken, getUserFromToken } from '@/app/lib/auth-middleware';

// Usage limits per plan
const USAGE_LIMITS = {
  free: {
    labelsPerMonth: 10,
  },
  plus: {
    labelsPerMonth: 60,
  },
  pro: {
    labelsPerMonth: -1, // Unlimited
  },
};

// Rate limiting
const validationAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const attempt = validationAttempts.get(userId);

  if (!attempt || now > attempt.resetAt) {
    validationAttempts.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (attempt.count >= 100) {
    return false;
  }

  attempt.count++;
  return true;
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function POST(req: NextRequest) {
  try {
    // Validate token
    const payload = await validateBearerToken(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Ungültiger oder fehlender Token' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(payload.userId)) {
      return NextResponse.json(
        { error: 'Zu viele Validierungs-Anfragen' },
        { status: 429 }
      );
    }

    // Get user with subscription
    const user = await getUserFromToken(payload);
    if (!user) {
      return NextResponse.json(
        { error: 'User nicht gefunden' },
        { status: 404 }
      );
    }

    // Verify device ownership
    if (!user.device) {
      return NextResponse.json(
        { error: 'Gerät nicht registriert' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const { labelCount } = body;

    if (!labelCount || labelCount < 1) {
      return NextResponse.json(
        { error: 'Ungültige Label-Anzahl' },
        { status: 400 }
      );
    }

    // Get current plan
    const plan = (user.subscription?.plan || 'free') as 'free' | 'plus' | 'pro';
    const limits = USAGE_LIMITS[plan];

    // Check if plan is unlimited
    if (limits.labelsPerMonth === -1) {
      // Unlimited - always allowed, but still track usage
      const currentMonth = getCurrentMonth();
      await prisma.usage.upsert({
        where: {
          userId_deviceId_month: {
            userId: user.id,
            deviceId: payload.deviceId,
            month: currentMonth,
          },
        },
        update: {
          labelsUsed: { increment: labelCount },
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          deviceId: payload.deviceId,
          plan,
          month: currentMonth,
          labelsUsed: labelCount,
        },
      });

      return NextResponse.json({
        allowed: true,
        remaining: -1, // Unlimited
        limit: -1,
      });
    }

    // Get current usage
    const currentMonth = getCurrentMonth();
    const usage = await prisma.usage.findUnique({
      where: {
        userId_deviceId_month: {
          userId: user.id,
          deviceId: payload.deviceId,
          month: currentMonth,
        },
      },
    });

    const currentUsage = usage?.labelsUsed || 0;
    const remaining = limits.labelsPerMonth - currentUsage;

    // Check if would exceed limit
    if (currentUsage + labelCount > limits.labelsPerMonth) {
      return NextResponse.json({
        allowed: false,
        reason: `Monatslimit erreicht. Sie haben ${currentUsage} von ${limits.labelsPerMonth} Labels verwendet. Upgraden Sie für mehr Labels.`,
        remaining: Math.max(0, remaining),
        limit: limits.labelsPerMonth,
      });
    }

    // Increment usage counter
    await prisma.usage.upsert({
      where: {
        userId_deviceId_month: {
          userId: user.id,
          deviceId: payload.deviceId,
          month: currentMonth,
        },
      },
      update: {
        labelsUsed: { increment: labelCount },
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceId: payload.deviceId,
        plan,
        month: currentMonth,
        labelsUsed: labelCount,
      },
    });

    return NextResponse.json({
      allowed: true,
      remaining: remaining - labelCount,
      limit: limits.labelsPerMonth,
    });
  } catch (error) {
    console.error('[App Validate Label Creation] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

