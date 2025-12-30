/**
 * Desktop App Device Registration Endpoint
 * POST /api/auth/app/register-device
 * Registers a new device for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateBearerToken, getUserFromToken, registerDevice, getDeviceCount } from '@/app/lib/auth-middleware';

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

    // Get user
    const user = await getUserFromToken(payload);
    if (!user) {
      return NextResponse.json(
        { error: 'User nicht gefunden' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await req.json();
    const { deviceId, deviceName } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Register device
    const result = await registerDevice(user.id, deviceId, deviceName);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Fehler beim Registrieren des Geräts' },
        { status: 403 }
      );
    }

    // Get updated device count
    const deviceCount = await getDeviceCount(user.id);

    return NextResponse.json({
      success: true,
      deviceId,
      deviceCount,
    });
  } catch (error) {
    console.error('[App Register Device] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

