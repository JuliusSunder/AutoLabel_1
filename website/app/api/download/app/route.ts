import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        licenses: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Get plan from subscription (fallback to "free")
    const plan = user.subscriptions[0]?.plan || "free";
    let license = user.licenses[0] || null;

    // Premium users need a valid license
    if (plan !== "free") {
      // Auto-create license if missing (for manual subscription changes via Prisma Studio)
      if (!license) {
        console.log(`[Download API] Premium subscription found without license for user ${user.id} (plan: ${plan})`);
        console.log(`[Download API] Auto-creating license for user ${user.id}`);
        
        try {
          license = await prisma.license.create({
            data: {
              userId: user.id,
              status: "active",
              plan: plan,
              expiresAt: user.subscriptions[0]?.currentPeriodEnd || null,
            },
          });
          
          console.log(`[Download API] ✓ Successfully created license ${license.licenseKey} for user ${user.id}`);
        } catch (createError) {
          console.error(`[Download API] Failed to create license for user ${user.id}:`, createError);
          return NextResponse.json(
            { error: "Keine gültige Lizenz gefunden. Bitte kontaktieren Sie den Support." },
            { status: 403 }
          );
        }
      }

      // Check if license is expired
      if (license.expiresAt && new Date() > license.expiresAt) {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: "expired" },
        });

        return NextResponse.json(
          { error: "Lizenz abgelaufen" },
          { status: 403 }
        );
      }
    }

    // Determine download URL
    // Use direct API endpoint if APP_DOWNLOAD_URL is not set or points to placeholder
    let downloadUrl = process.env.APP_DOWNLOAD_URL;
    
    if (!downloadUrl || downloadUrl.includes("your-username") || downloadUrl.includes("github.com/your-username")) {
      // Use direct public file path (works on Vercel)
      // Get the base URL from the request to ensure correct domain
      const protocol = req.headers.get("x-forwarded-proto") || "https";
      const host = req.headers.get("host") || "autolabel.app";
      const baseUrl = `${protocol}://${host}`;
      downloadUrl = `${baseUrl}/downloads/AutoLabel-Setup.exe`;
    }

    // Return download URL
    // Free plan users get no license key, premium users get their license key
    return NextResponse.json(
      {
        downloadUrl: downloadUrl,
        licenseKey: license?.licenseKey || null,
        plan: plan,
        expiresAt: license?.expiresAt || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen des Downloads" },
      { status: 500 }
    );
  }
}

