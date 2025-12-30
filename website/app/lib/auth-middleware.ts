/**
 * Auth Middleware
 * Helper functions for token validation and user authentication
 */

import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifyAccessToken, extractBearerToken, type JWTPayload } from './jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  deviceId: string;
}

export interface UserWithSubscription extends AuthenticatedUser {
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date | null;
  } | null;
  device: {
    id: string;
    deviceId: string;
    deviceName: string | null;
    registeredAt: Date;
    lastSeen: Date;
  } | null;
}

/**
 * Validate bearer token from request
 * Returns decoded JWT payload or null if invalid
 */
export async function validateBearerToken(
  request: NextRequest
): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    console.error('[Auth Middleware] Token validation failed:', error);
    return null;
  }
}

/**
 * Get user from token with subscription and device info
 */
export async function getUserFromToken(
  payload: JWTPayload
): Promise<UserWithSubscription | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        devices: {
          where: { deviceId: payload.deviceId },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    const subscription = user.subscriptions[0] || null;
    const device = user.devices[0] || null;

    // Update device lastSeen
    if (device) {
      await prisma.device.update({
        where: { id: device.id },
        data: { lastSeen: new Date() },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      deviceId: payload.deviceId,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            expiresAt: subscription.currentPeriodEnd,
          }
        : null,
      device: device
        ? {
            id: device.id,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            registeredAt: device.registeredAt,
            lastSeen: device.lastSeen,
          }
        : null,
    };
  } catch (error) {
    console.error('[Auth Middleware] Failed to get user from token:', error);
    return null;
  }
}

/**
 * Check device limit for user
 * Returns true if user can register another device
 */
export async function checkDeviceLimit(userId: string): Promise<boolean> {
  try {
    const deviceCount = await prisma.device.count({
      where: { userId },
    });

    return deviceCount < 3; // Max 3 devices
  } catch (error) {
    console.error('[Auth Middleware] Failed to check device limit:', error);
    return false;
  }
}

/**
 * Get device count for user
 */
export async function getDeviceCount(userId: string): Promise<number> {
  try {
    return await prisma.device.count({
      where: { userId },
    });
  } catch (error) {
    console.error('[Auth Middleware] Failed to get device count:', error);
    return 0;
  }
}

/**
 * Register or update device for user
 */
export async function registerDevice(
  userId: string,
  deviceId: string,
  deviceName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (existingDevice) {
      // Device exists - check if it belongs to this user
      if (existingDevice.userId !== userId) {
        return {
          success: false,
          error: 'Dieses Gerät ist bereits mit einem anderen Account registriert',
        };
      }

      // Update existing device
      await prisma.device.update({
        where: { deviceId },
        data: {
          lastSeen: new Date(),
          deviceName: deviceName || existingDevice.deviceName,
        },
      });

      return { success: true };
    }

    // Check device limit before creating new device
    const canRegister = await checkDeviceLimit(userId);
    if (!canRegister) {
      return {
        success: false,
        error: 'Maximale Anzahl an Geräten erreicht (3)',
      };
    }

    // Create new device
    await prisma.device.create({
      data: {
        userId,
        deviceId,
        deviceName,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[Auth Middleware] Failed to register device:', error);
    return {
      success: false,
      error: 'Fehler beim Registrieren des Geräts',
    };
  }
}

/**
 * Verify device belongs to user
 */
export async function verifyDeviceOwnership(
  userId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const device = await prisma.device.findFirst({
      where: {
        userId,
        deviceId,
      },
    });

    return !!device;
  } catch (error) {
    console.error('[Auth Middleware] Failed to verify device ownership:', error);
    return false;
  }
}

