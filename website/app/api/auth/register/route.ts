import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not configured!");
      return NextResponse.json(
        { error: "Datenbank-Konfiguration fehlt. Bitte kontaktieren Sie den Support." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Create free subscription for new user
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: null, // Will be set when user makes first purchase
        status: "active",
        plan: "free",
      },
    });

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("@/app/lib/email");
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        message: "Registrierung erfolgreich",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log detailed error information
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Missing",
    });
    
    return NextResponse.json(
      { 
        error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
        // Include error details in development
        ...(process.env.NODE_ENV === "development" && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}

