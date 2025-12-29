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
          requiresCheckout: true,
        },
        { status: 400 }
      );
    }

    // Prüfe ob Downgrade
    const planHierarchy = { free: 0, plus: 1, pro: 2 };
    const currentPlanLevel = planHierarchy[existingSubscription.plan as keyof typeof planHierarchy] ?? 0;
    const targetPlanLevel = planHierarchy[plan.toLowerCase() as keyof typeof planHierarchy] ?? 0;
    
    if (targetPlanLevel < currentPlanLevel) {
      return NextResponse.json(
        { error: "Downgrade nicht möglich. Sie können nur auf einen höheren Plan upgraden." },
        { status: 400 }
      );
    }

    if (currentPlanLevel === targetPlanLevel) {
      return NextResponse.json(
        { error: "Sie haben bereits diesen Plan" },
        { status: 400 }
      );
    }

    // Prüfe ob bereits eine Subscription mit diesem Plan existiert
    if (!existingSubscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Keine gültige Subscription gefunden" },
        { status: 400 }
      );
    }

    // Hole bestehende Stripe Subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      existingSubscription.stripeSubscriptionId
    );

    // Prüfe ob Subscription Items existieren
    if (!stripeSubscription.items || !stripeSubscription.items.data || stripeSubscription.items.data.length === 0) {
      console.error("Subscription has no items:", {
        subscriptionId: existingSubscription.stripeSubscriptionId,
        items: stripeSubscription.items,
      });
      return NextResponse.json(
        { error: "Subscription hat keine Items" },
        { status: 400 }
      );
    }

    const subscriptionItemId = stripeSubscription.items.data[0].id;

    // Prüfe ob bereits ein Upgrade-Prozess läuft
    // Verhindert mehrfache Abbuchungen
    const recentCheckoutSessions = await stripe.checkout.sessions.list({
      customer: existingSubscription.stripeCustomerId,
      limit: 10,
    });

    // Prüfe ob es eine aktive Checkout-Session für ein Upgrade gibt
    const activeUpgradeSession = recentCheckoutSessions.data.find(session => 
      session.metadata?.isUpgrade === "true" &&
      session.metadata?.targetPlan === plan.toLowerCase() &&
      session.metadata?.existingSubscriptionId === existingSubscription.stripeSubscriptionId &&
      session.status === 'open' &&
      // Session ist nicht älter als 30 Minuten
      (Date.now() - (session.created * 1000)) < 30 * 60 * 1000
    );

    if (activeUpgradeSession) {
      // Es gibt bereits eine offene Checkout-Session für dieses Upgrade
      console.log("Found active upgrade session:", activeUpgradeSession.id);
      return NextResponse.json(
        { 
          sessionId: activeUpgradeSession.id,
          url: activeUpgradeSession.url,
          message: "Es existiert bereits eine offene Checkout-Session für dieses Upgrade",
        },
        { status: 200 }
      );
    }

    // Prüfe ob kürzlich ein Upgrade abgeschlossen wurde (in den letzten 5 Minuten)
    const recentCompletedUpgrade = recentCheckoutSessions.data.find(session => 
      session.metadata?.isUpgrade === "true" &&
      session.metadata?.targetPlan === plan.toLowerCase() &&
      session.metadata?.existingSubscriptionId === existingSubscription.stripeSubscriptionId &&
      session.status === 'complete' &&
      (Date.now() - (session.created * 1000)) < 5 * 60 * 1000
    );

    if (recentCompletedUpgrade) {
      // Upgrade wurde bereits abgeschlossen
      console.log("Found recent completed upgrade:", recentCompletedUpgrade.id);
      return NextResponse.json(
        { 
          error: "Dieses Upgrade wurde bereits durchgeführt. Bitte laden Sie die Seite neu.",
        },
        { status: 400 }
      );
    }

    // WICHTIG: Erstelle zuerst die Checkout Session, OHNE die Subscription zu updaten
    // Die Subscription wird erst nach erfolgreicher Zahlung im Webhook updated
    
    // Berechne Proration manuell für die Anzeige
    const now = Math.floor(Date.now() / 1000);
    const periodEnd = stripeSubscription.current_period_end;
    const periodStart = stripeSubscription.current_period_start;
    const remainingTime = periodEnd - now;
    const totalTime = periodEnd - periodStart;
    const remainingRatio = remainingTime / totalTime;

    // Hole Preise für Berechnung
    const currentPrice = await stripe.prices.retrieve(stripeSubscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(priceId);

    const currentAmount = currentPrice.unit_amount || 0;
    const newAmount = newPrice.unit_amount || 0;

    // Berechne Proration
    const unusedAmount = Math.floor(currentAmount * remainingRatio);
    const newPeriodAmount = Math.floor(newAmount * remainingRatio);
    const upgradeAmount = newPeriodAmount - unusedAmount;

    console.log("Proration calculation:", {
      currentAmount,
      newAmount,
      remainingRatio,
      unusedAmount,
      newPeriodAmount,
      upgradeAmount,
    });

    // Erstelle Checkout Session für das Upgrade
    // WICHTIG: Wir erstellen eine neue Subscription mit subscription mode
    // und kündigen die alte Subscription nach erfolgreicher Zahlung
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: existingSubscription.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan.toLowerCase(),
          billingPeriod: billingPeriod.toLowerCase(),
          isUpgrade: "true",
          oldSubscriptionId: existingSubscription.stripeSubscriptionId,
        },
        // KEINE proration_behavior - Stripe erstellt automatisch eine neue Subscription
        // Die alte Subscription wird im Webhook gekündigt
      },
      metadata: {
        userId: user.id,
        targetPlan: plan.toLowerCase(),
        billingPeriod: billingPeriod.toLowerCase(),
        isUpgrade: "true",
        existingSubscriptionId: existingSubscription.stripeSubscriptionId,
        oldPlan: existingSubscription.plan,
      },
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}&upgrade=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cancel`,
      // Erlaube nur eine Subscription pro Customer
      // WICHTIG: Wir müssen die alte Subscription manuell kündigen im Webhook
    });

    console.log("Created upgrade checkout session:", {
      sessionId: checkoutSession.id,
      customerId: existingSubscription.stripeCustomerId,
      targetPlan: plan.toLowerCase(),
      existingSubscriptionId: existingSubscription.stripeSubscriptionId,
    });

    return NextResponse.json(
      { 
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upgrade checkout session error:", error);
    
    // Detaillierte Fehlerinformationen für Debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Stripe-spezifische Fehler-Details
    const stripeError = (error as any)?.type || (error as any)?.code || undefined;
    const stripeMessage = (error as any)?.message || (error as any)?.raw?.message || undefined;
    const stripeDeclineCode = (error as any)?.decline_code || undefined;
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      stripeError,
      stripeMessage,
      stripeDeclineCode,
      rawError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    
    // Immer Details zurückgeben für besseres Debugging
    return NextResponse.json(
      { 
        error: "Fehler beim Erstellen der Upgrade-Checkout-Session",
        details: {
          message: errorMessage,
          stripeError: stripeError || null,
          stripeMessage: stripeMessage || null,
          // Im Development-Modus auch Stack-Trace
          ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
        },
      },
      { status: 500 }
    );
  }
}
