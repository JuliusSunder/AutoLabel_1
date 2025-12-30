/**
 * Desktop App Device Management Endpoint
 * DELETE /api/auth/app/device/:deviceId
 * Removes a device registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateBearerToken, getUserFromToken } from '@/app/lib/auth-middleware';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { deviceId: string } }
) {
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

    const { deviceId } = params;

    // Find device
    const device = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Gerät nicht gefunden' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (device.userId !== user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für dieses Gerät' },
        { status: 403 }
      );
    }

    // Delete device
    await prisma.device.delete({
      where: { deviceId },
    });

    // Also delete associated refresh tokens
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        deviceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gerät erfolgreich entfernt',
    });
  } catch (error) {
    console.error('[App Delete Device] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

