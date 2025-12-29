import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendLicenseEmail } from "@/app/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, name, licenseKey, plan } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Fehlende Parameter" },
        { status: 400 }
      );
    }

    switch (type) {
      case "welcome":
        await sendWelcomeEmail(email, name);
        break;

      case "license":
        if (!licenseKey || !plan) {
          return NextResponse.json(
            { error: "License Key und Plan erforderlich" },
            { status: 400 }
          );
        }
        await sendLicenseEmail(email, licenseKey, plan, name);
        break;

      default:
        return NextResponse.json(
          { error: "Ungültiger Email-Typ" },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { message: "Email erfolgreich gesendet" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Fehler beim Senden der Email" },
      { status: 500 }
    );
  }
}

