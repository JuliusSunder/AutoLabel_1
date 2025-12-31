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
  { params }: { params: Promise<{ deviceId: string }> }
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

    // Await params (Next.js 16+)
    const { deviceId } = await params;

    // Find device - use findFirst since deviceId alone is not unique
    // Only the combination userId + deviceId is unique
    const device = await prisma.device.findFirst({
      where: {
        userId: user.id,
        deviceId,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Gerät nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete device - use the compound unique key
    await prisma.device.delete({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId,
        },
      },
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

