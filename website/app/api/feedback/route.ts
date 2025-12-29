import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with API key check
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Emails cannot be sent.");
  }
  return new Resend(apiKey);
};

const resend = getResendClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, message, name } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured!");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const emailFrom = process.env.EMAIL_FROM || "noreply@autolabel.com";

    console.log("=== SENDING FEEDBACK EMAIL ===");
    console.log("To: AutoLabel@gmx.de");
    console.log("From:", emailFrom);
    console.log("ReplyTo:", email);
    console.log("Subject: Feedback from", name || email);

    // Send feedback email to AutoLabel@gmx.de
    const result = await resend.emails.send({
      from: emailFrom,
      to: "AutoLabel@gmx.de",
      replyTo: email,
      subject: `Feedback from ${name || email}`,
      html: `
        <h2>New Feedback Submission</h2>
        <p><strong>From:</strong> ${name ? `${name} (${email})` : email}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    });

    console.log("=== FEEDBACK EMAIL RESULT ===");
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log("Result ID:", result?.data?.id);
    console.log("Result error:", result?.error);

    if (result?.error) {
      console.error("Resend API Error:", result.error);
      return NextResponse.json(
        { error: "Failed to send feedback. Please try again later." },
        { status: 500 }
      );
    }

    if (!result?.data?.id) {
      console.error("Resend API returned no email ID");
      return NextResponse.json(
        { error: "Failed to send feedback. Please try again later." },
        { status: 500 }
      );
    }

    console.log("Feedback email sent successfully. Email ID:", result.data.id);

    return NextResponse.json(
      { message: "Feedback sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Feedback email error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);
    
    return NextResponse.json(
      { error: `Failed to send feedback: ${errorMessage}` },
      { status: 500 }
    );
  }
}

