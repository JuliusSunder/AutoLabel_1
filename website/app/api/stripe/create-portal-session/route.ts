import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe-server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: {
            OR: [
              { stripeSubscriptionId: { not: null } },
              { status: "active" },
            ],
          },
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

    const existingSubscription = user.subscriptions[0];

    if (!existingSubscription || !existingSubscription.stripeCustomerId) {
      return NextResponse.json(
        { 
          error: "Keine aktive Subscription gefunden",
        },
        { status: 400 }
      );
    }

    // Erstelle Customer Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: existingSubscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
    });

    return NextResponse.json(
      { 
        url: portalSession.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Portal-Session" },
      { status: 500 }
    );
  }
}

