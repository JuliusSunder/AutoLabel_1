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
          // Suche nach Subscription mit stripeSubscriptionId (unabhängig vom Status)
          // oder nach aktiver Subscription
          where: {
            OR: [
              { stripeSubscriptionId: { not: null } },
              { status: "active" },
            ],
          },
          orderBy: { createdAt: "desc" }, // Neueste zuerst
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

    console.log("Upgrade subscription check:", {
      userId: user.id,
      foundSubscriptions: user.subscriptions.length,
      subscription: existingSubscription ? {
        id: existingSubscription.id,
        plan: existingSubscription.plan,
        status: existingSubscription.status,
        hasStripeSubscriptionId: !!existingSubscription.stripeSubscriptionId,
        stripeSubscriptionId: existingSubscription.stripeSubscriptionId,
      } : null,
    });

    // Wenn keine Subscription mit stripeSubscriptionId existiert, versuche sie von Stripe zu holen
    if (!existingSubscription || !existingSubscription.stripeSubscriptionId) {
      // Fallback: Versuche Subscription über stripeCustomerId zu finden
      if (existingSubscription?.stripeCustomerId) {
        try {
          const stripeSubscriptions = await stripe.subscriptions.list({
            customer: existingSubscription.stripeCustomerId,
            status: "active",
            limit: 1,
          });

          if (stripeSubscriptions.data.length > 0) {
            const stripeSub = stripeSubscriptions.data[0];
            // Aktualisiere lokale Subscription mit stripeSubscriptionId
            const updatedSub = await prisma.subscription.update({
              where: { id: existingSubscription.id },
              data: {
                stripeSubscriptionId: stripeSub.id,
                status: stripeSub.status,
              },
            });
            // Verwende die aktualisierte Subscription
            existingSubscription.stripeSubscriptionId = updatedSub.stripeSubscriptionId;
          }
        } catch (error) {
          console.error("Error fetching subscription from Stripe:", error);
        }
      }

      // Wenn immer noch keine stripeSubscriptionId vorhanden ist
      if (!existingSubscription || !existingSubscription.stripeSubscriptionId) {
        console.error("No subscription with stripeSubscriptionId found:", {
          userId: user.id,
          subscriptions: user.subscriptions,
        });
        return NextResponse.json(
          { 
            error: "Keine aktive Subscription gefunden",
            requiresCheckout: true,
          },
          { status: 400 }
        );
      }
    }

    // Upgrade: Bestehende Subscription aktualisieren
    const stripeSubscription = await stripe.subscriptions.retrieve(
      existingSubscription.stripeSubscriptionId
    );

    // Prüfe ob bereits der gleiche Plan
    const currentPlan = existingSubscription.plan;
    if (currentPlan === plan.toLowerCase()) {
      return NextResponse.json(
        { error: "Sie haben bereits diesen Plan" },
        { status: 400 }
      );
    }

    // Verhindere Downgrade: Pro → Plus ist nicht erlaubt
    const planHierarchy = { free: 0, plus: 1, pro: 2 };
    const currentPlanLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] ?? 0;
    const targetPlanLevel = planHierarchy[plan.toLowerCase() as keyof typeof planHierarchy] ?? 0;
    
    if (targetPlanLevel < currentPlanLevel) {
      return NextResponse.json(
        { error: "Downgrade nicht möglich. Sie können nur auf einen höheren Plan upgraden." },
        { status: 400 }
      );
    }

    // Aktualisiere Subscription mit neuem Plan
    // Stripe berechnet automatisch die Differenz (Proration)
    const updatedSubscription = await stripe.subscriptions.update(
      existingSubscription.stripeSubscriptionId,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'always_invoice', // Berechnet Differenz sofort
        metadata: {
          userId: user.id,
          plan: plan.toLowerCase(),
          billingPeriod: billingPeriod.toLowerCase(),
        },
      }
    );

    // Aktualisiere lokale Database sofort
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan: plan.toLowerCase(),
        billingPeriod: billingPeriod.toLowerCase(),
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      },
    });

    // Aktualisiere License
    await prisma.license.updateMany({
      where: {
        userId: user.id,
        status: "active",
      },
      data: {
        plan: plan.toLowerCase(),
        expiresAt: new Date(updatedSubscription.current_period_end * 1000),
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Upgrade erfolgreich",
        subscriptionId: updatedSubscription.id,
        plan: plan.toLowerCase(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Fehler beim Upgrade" },
      { status: 500 }
    );
  }
}

