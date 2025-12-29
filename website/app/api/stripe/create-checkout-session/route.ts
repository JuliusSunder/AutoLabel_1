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

    const body = await req.json();
    const { priceId, plan, billingPeriod } = body;

    if (!priceId || !plan || !billingPeriod) {
      return NextResponse.json(
        { error: "Fehlende Parameter" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          where: {
            OR: [
              { status: "active" },
              { stripeSubscriptionId: { not: null } },
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

    // Prüfe ob bereits eine aktive Subscription existiert
    if (user.subscriptions.length > 0) {
      const existingSubscription = user.subscriptions[0];
      const existingPlan = existingSubscription.plan;
      
      // Prüfe ob User bereits diesen Plan hat
      if (existingPlan === plan.toLowerCase() && existingSubscription.status === "active") {
        return NextResponse.json(
          { 
            error: "Sie haben bereits diesen Plan",
          },
          { status: 400 }
        );
      }
      
      // Wenn bereits eine aktive Subscription mit Stripe existiert, muss Upgrade verwendet werden
      // Verhindert doppelte Subscriptions
      if (existingSubscription.stripeSubscriptionId && existingSubscription.status === "active") {
        return NextResponse.json(
          { 
            error: "Sie haben bereits eine aktive Subscription. Bitte verwenden Sie die Upgrade-Funktion.",
            requiresUpgrade: true,
          },
          { status: 400 }
        );
      }
    }

    // Prüfe ob bereits eine offene Checkout-Session existiert (verhindert Doppel-Käufe)
    if (user.subscriptions.length > 0 && user.subscriptions[0].stripeCustomerId) {
      const recentCheckoutSessions = await stripe.checkout.sessions.list({
        customer: user.subscriptions[0].stripeCustomerId,
        limit: 5,
      });

      const activeSession = recentCheckoutSessions.data.find(session => 
        session.status === 'open' &&
        session.metadata?.plan === plan.toLowerCase() &&
        // Session ist nicht älter als 30 Minuten
        (Date.now() - (session.created * 1000)) < 30 * 60 * 1000
      );

      if (activeSession) {
        console.log("Found active checkout session:", activeSession.id);
        return NextResponse.json(
          { 
            sessionId: activeSession.id,
            url: activeSession.url,
            message: "Es existiert bereits eine offene Checkout-Session",
          },
          { status: 200 }
        );
      }
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.subscriptions[0]?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cancel`,
      metadata: {
        userId: user.id,
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          billingPeriod,
        },
      },
    });

    return NextResponse.json(
      { 
        sessionId: checkoutSession.id,
        url: checkoutSession.url, // Add URL for direct redirect
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Session" },
      { status: 500 }
    );
  }
}

