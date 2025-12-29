import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/app/lib/email";

// Test endpoint to check email configuration
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const testEmail = searchParams.get("email") || "test@example.com";
    
    console.log("=== EMAIL TEST START ===");
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length || 0);
    console.log("RESEND_API_KEY starts with 're_':", process.env.RESEND_API_KEY?.startsWith("re_") || false);
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "not set");
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "not set");
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "not set");
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { 
          error: "RESEND_API_KEY ist nicht gesetzt",
          details: {
            hasApiKey: false,
            emailFrom: process.env.EMAIL_FROM || "not set",
          }
        },
        { status: 500 }
      );
    }
    
    // Try to send a test email
    try {
      await sendPasswordResetEmail(testEmail, "test-token-123", "Test User");
      return NextResponse.json(
        { 
          success: true,
          message: `Test-E-Mail wurde an ${testEmail} gesendet`,
          details: {
            hasApiKey: true,
            emailFrom: process.env.EMAIL_FROM || "not set",
          }
        },
        { status: 200 }
      );
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : "Unbekannter Fehler";
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { 
          error: "Fehler beim Senden der Test-E-Mail",
          details: {
            hasApiKey: true,
            emailFrom: process.env.EMAIL_FROM || "not set",
            errorMessage: errorMessage,
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Unbekannter Fehler", details: error },
      { status: 500 }
    );
  }
}

