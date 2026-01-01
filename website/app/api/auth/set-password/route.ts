/**
 * Set Password for OAuth Users
 * POST /api/auth/set-password
 * 
 * Allows OAuth users (Google login) to set a password so they can
 * login to the desktop app with email + password
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Set password for OAuth user
 */
export async function POST(req: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password } = body;

    // Validate password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Passwort ist erforderlich' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { error: 'Sie haben bereits ein Passwort gesetzt. Nutzen Sie die Passwort-Zurücksetzen-Funktion, um es zu ändern.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log('[SetPassword] Password set successfully', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich gesetzt. Sie können sich jetzt in der Desktop-App anmelden.',
    });
  } catch (error) {
    console.error('[SetPassword] Error:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

