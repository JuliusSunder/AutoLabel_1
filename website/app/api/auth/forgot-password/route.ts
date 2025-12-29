import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    console.log("=== FORGOT PASSWORD REQUEST ===");
    console.log("Email:", email);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length || 0);
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "not set");

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      );
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY ist nicht gesetzt!");
      return NextResponse.json(
        { error: "E-Mail-Konfiguration fehlt. Bitte setzen Sie RESEND_API_KEY in Ihrer .env Datei." },
        { status: 500 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    // Always return success message, even if user doesn't exist
    if (!user) {
      return NextResponse.json(
        { message: "Wenn ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet." },
        { status: 200 }
      );
    }

    // Generate secure random token
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    try {
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });
    } catch (deleteError) {
      console.error("Error deleting existing tokens:", deleteError);
      // Continue anyway - might be first token
    }

    // Create new reset token
    try {
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });
    } catch (createError) {
      console.error("Error creating reset token:", createError);
      throw new Error(`Fehler beim Erstellen des Reset-Tokens: ${createError instanceof Error ? createError.message : "Unbekannter Fehler"}`);
    }

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      const emailErrorMessage = emailError instanceof Error ? emailError.message : "Unbekannter E-Mail-Fehler";
      console.error("Email error details:", emailErrorMessage);
      
      // Delete the token if email fails
      try {
        await prisma.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            token: resetToken,
          },
        });
      } catch (deleteError) {
        console.error("Error deleting token after email failure:", deleteError);
      }
      
      // Check if it's a missing API key error
      if (emailErrorMessage.includes("API key") || emailErrorMessage.includes("RESEND") || emailErrorMessage.includes("nicht konfiguriert")) {
        console.error("E-Mail-Konfiguration fehlt! Bitte setzen Sie RESEND_API_KEY in Ihrer .env Datei.");
        return NextResponse.json(
          { error: "E-Mail-Konfiguration fehlt. Der Administrator wurde benachrichtigt. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support." },
          { status: 500 }
        );
      }
      
      // Check if it's a domain verification error
      if (emailErrorMessage.includes("Domain") || emailErrorMessage.includes("domain") || emailErrorMessage.includes("verifiziert")) {
        console.error("E-Mail-Domain ist nicht verifiziert! Bitte verifizieren Sie Ihre Domain im Resend Dashboard.");
        return NextResponse.json(
          { error: "E-Mail-Domain ist nicht verifiziert. Der Administrator wurde benachrichtigt." },
          { status: 500 }
        );
      }
      
      // Generic email error
      console.error("E-Mail-Versand fehlgeschlagen:", emailErrorMessage);
      return NextResponse.json(
        { error: `Fehler beim Senden der E-Mail: ${emailErrorMessage}. Bitte versuchen Sie es später erneut.` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Wenn ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: `Ein Fehler ist aufgetreten: ${errorMessage}. Bitte versuchen Sie es erneut.` },
      { status: 500 }
    );
  }
}

