import { Resend } from "resend";

// Initialize Resend with API key check
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY ist nicht gesetzt. E-Mails können nicht versendet werden.");
  }
  return new Resend(apiKey);
};

const resend = getResendClient();

export async function sendWelcomeEmail(email: string, name?: string | null) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@autolabel.com",
      to: email,
      subject: "Willkommen bei AutoLabel!",
      html: `
        <h1>Willkommen bei AutoLabel${name ? `, ${name}` : ""}!</h1>
        <p>Vielen Dank für Ihre Registrierung bei AutoLabel.</p>
        <p>Sie können sich jetzt einloggen und mit unserem kostenlosen Plan beginnen.</p>
        <p>Wenn Sie mehr Funktionen benötigen, können Sie jederzeit auf einen unserer Premium-Pläne upgraden.</p>
        <br>
        <p>Viel Erfolg mit AutoLabel!</p>
        <p>Ihr AutoLabel Team</p>
      `,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

export async function sendLicenseEmail(
  email: string,
  licenseKey: string,
  plan: string,
  name?: string | null
) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@autolabel.com",
      to: email,
      subject: "Ihr AutoLabel License Key",
      html: `
        <h1>Vielen Dank für Ihren Kauf${name ? `, ${name}` : ""}!</h1>
        <p>Ihre Zahlung war erfolgreich. Hier sind Ihre Lizenzinformationen:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Ihre Lizenz</h2>
          <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
          <p><strong>License Key:</strong></p>
          <code style="background-color: #fff; padding: 10px; display: block; font-size: 16px; border: 1px solid #ddd; border-radius: 4px;">
            ${licenseKey}
          </code>
        </div>

        <h3>Installation</h3>
        <ol>
          <li>Laden Sie AutoLabel herunter: <a href="${process.env.APP_DOWNLOAD_URL}">Download</a></li>
          <li>Installieren Sie die Anwendung</li>
          <li>Geben Sie Ihren License Key ein, wenn Sie dazu aufgefordert werden</li>
        </ol>

        <p>Sie können Ihren License Key auch jederzeit in Ihrem Dashboard abrufen.</p>

        <br>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <p>Ihr AutoLabel Team</p>
      `,
    });
  } catch (error) {
    console.error("Error sending license email:", error);
  }
}

export async function sendPaymentFailedEmail(email: string, name?: string | null) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@autolabel.com",
      to: email,
      subject: "Zahlungsproblem bei AutoLabel",
      html: `
        <h1>Zahlungsproblem${name ? `, ${name}` : ""}</h1>
        <p>Leider konnten wir Ihre letzte Zahlung nicht verarbeiten.</p>
        <p>Bitte überprüfen Sie Ihre Zahlungsinformationen in Ihrem Dashboard.</p>
        <p>Wenn das Problem weiterhin besteht, kontaktieren Sie bitte unseren Support.</p>
        <br>
        <p>Ihr AutoLabel Team</p>
      `,
    });
  } catch (error) {
    console.error("Error sending payment failed email:", error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name?: string | null
) {
  // Check if RESEND_API_KEY is configured
  if (!process.env.RESEND_API_KEY) {
    const error = new Error("RESEND_API_KEY ist nicht konfiguriert. Bitte setzen Sie RESEND_API_KEY in Ihrer .env Datei.");
    console.error("Email configuration error:", error.message);
    throw error;
  }

  // Check if EMAIL_FROM is configured
  const emailFrom = process.env.EMAIL_FROM || "noreply@autolabel.com";
  if (!emailFrom || emailFrom === "noreply@autolabel.com") {
    console.warn("EMAIL_FROM ist nicht konfiguriert. Verwende Standard-Wert:", emailFrom);
  }

  try {
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    
    console.log("=== SENDING PASSWORD RESET EMAIL ===");
    console.log("To:", email);
    console.log("From:", emailFrom);
    console.log("Reset URL:", resetUrl);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length || 0);
    
    const result = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "Passwort zurücksetzen - AutoLabel",
      html: `
        <h1>Passwort zurücksetzen${name ? `, ${name}` : ""}</h1>
        <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
        <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Passwort zurücksetzen
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Oder kopieren Sie diesen Link in Ihren Browser:<br>
          <code style="background-color: #f5f5f5; padding: 8px; display: block; margin-top: 8px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </code>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          <strong>Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail einfach.
        </p>
        
        <br>
        <p>Ihr AutoLabel Team</p>
      `,
    });

    console.log("=== EMAIL SEND RESULT ===");
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log("Result ID:", result?.data?.id);
    console.log("Result error:", result?.error);
    
    if (result?.error) {
      throw new Error(`Resend API Error: ${JSON.stringify(result.error)}`);
    }
    
    if (!result?.data?.id) {
      throw new Error("Resend API returned no email ID. Email may not have been sent.");
    }
    
    console.log("Password reset email sent successfully. Email ID:", result.data.id);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for common Resend API errors
      if (error.message.includes("API key") || error.message.includes("Unauthorized")) {
        throw new Error("RESEND_API_KEY ist ungültig oder fehlt. Bitte überprüfen Sie Ihre .env Datei.");
      }
      if (error.message.includes("domain") || error.message.includes("Domain")) {
        throw new Error("E-Mail-Domain ist nicht verifiziert. Bitte verifizieren Sie Ihre Domain im Resend Dashboard.");
      }
      if (error.message.includes("from")) {
        throw new Error(`Ungültige Absender-E-Mail-Adresse: ${emailFrom}. Bitte überprüfen Sie EMAIL_FROM in Ihrer .env Datei.`);
      }
    }
    
    throw error;
  }
}

