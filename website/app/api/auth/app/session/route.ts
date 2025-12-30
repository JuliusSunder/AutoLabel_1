/**
 * Desktop App Session Endpoint
 * GET /api/auth/app/session
 * Returns current user session info
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateBearerToken, getUserFromToken } from '@/app/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Validate token
    const payload = await validateBearerToken(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Ungültiger oder fehlender Token' },
        { status: 401 }
      );
    }

    // Get user with subscription and device info
    const user = await getUserFromToken(payload);
    if (!user) {
      return NextResponse.json(
        { error: 'User nicht gefunden' },
        { status: 404 }
      );
    }

    // Return session info
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: user.subscription || {
        plan: 'free',
        status: 'active',
        expiresAt: null,
      },
      device: user.device
        ? {
            id: user.device.deviceId,
            registeredAt: user.device.registeredAt.toISOString(),
            lastSeen: user.device.lastSeen.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('[App Session] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

