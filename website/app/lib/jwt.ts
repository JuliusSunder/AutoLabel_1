/**
 * JWT Token Management
 * Handles creation and validation of JWT tokens for desktop app authentication
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 days

export interface JWTPayload {
  userId: string;
  deviceId: string;
  email: string;
}

/**
 * Generate JWT access token
 * Short-lived token for API requests
 */
export function generateAccessToken(payload: JWTPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'autolabel-api',
    audience: 'autolabel-app',
  });
}

/**
 * Generate refresh token
 * Long-lived token stored in database
 */
export function generateRefreshToken(): string {
  return randomUUID();
}

/**
 * Verify and decode JWT access token
 * Throws error if token is invalid or expired
 */
export function verifyAccessToken(token: string): JWTPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'autolabel-api',
      audience: 'autolabel-app',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Get token expiry time in seconds
 */
export function getAccessTokenExpirySeconds(): number {
  return 15 * 60; // 15 minutes in seconds
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

