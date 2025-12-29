import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { error: "License Key ist erforderlich" },
        { status: 400 }
      );
    }

    // Find license by key
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: "active" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: "Ungültiger License Key" },
        { status: 404 }
      );
    }

    // Check if license is active
    if (license.status !== "active") {
      return NextResponse.json(
        { error: `Lizenz ist ${license.status === "expired" ? "abgelaufen" : "nicht aktiv"}` },
        { status: 403 }
      );
    }

    // Check if license is expired
    if (license.expiresAt && new Date() > license.expiresAt) {
      // Update license status to expired
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "expired" },
      });

      return NextResponse.json(
        { error: "Lizenz abgelaufen" },
        { status: 403 }
      );
    }

    // Check if user has active subscription
    const subscription = license.user.subscriptions[0];
    if (!subscription || subscription.status !== "active") {
      return NextResponse.json(
        { error: "Keine aktive Subscription gefunden" },
        { status: 403 }
      );
    }

    // Return license info
    return NextResponse.json(
      {
        valid: true,
        plan: license.plan,
        expiresAt: license.expiresAt,
        user: {
          email: license.user.email,
          name: license.user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Validierung" },
      { status: 500 }
    );
  }
}

