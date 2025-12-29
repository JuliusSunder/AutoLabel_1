import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe-server";
import { prisma } from "@/app/lib/prisma";
import { v4 as uuidv4 } from "uuid";

/**
 * Test Sync Endpoint - Directly sync with Customer ID
 * Use this for testing: POST /api/stripe/test-sync with body: { customerId: "cus_..." }
 */
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
    const customerId = body.customerId as string;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID ist erforderlich" },
        { status: 400 }
      );
    }

    console.log("Test sync with customer ID:", customerId);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Get all subscriptions for this customer
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    console.log("Found subscriptions:", stripeSubscriptions.data.length);

    if (stripeSubscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "Keine Subscription in Stripe gefunden für diese Customer ID" },
        { status: 404 }
      );
    }

    // Get the most recent active subscription
    const activeSubscription = stripeSubscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "Keine aktive Subscription gefunden" },
        { status: 404 }
      );
    }

    // Get plan from subscription metadata or price
    const plan = activeSubscription.metadata?.plan || "plus"; // Default to plus if not set
    const billingPeriod =
      activeSubscription.items.data[0]?.price.recurring?.interval === "year"
        ? "yearly"
        : "monthly";

    console.log("Syncing subscription:", {
      userId: user.id,
      customerId,
      subscriptionId: activeSubscription.id,
      plan,
      billingPeriod,
    });

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: {
        stripeSubscriptionId: activeSubscription.id,
        status: activeSubscription.status === "trialing" ? "active" : activeSubscription.status,
        plan,
        billingPeriod,
        currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      },
      create: {
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: activeSubscription.id,
        status: activeSubscription.status === "trialing" ? "active" : activeSubscription.status,
        plan,
        billingPeriod,
        currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      },
    });

    // Check if license already exists
    const existingLicense = await prisma.license.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
    });

    if (existingLicense) {
      // Update existing license
      await prisma.license.update({
        where: { id: existingLicense.id },
        data: {
          plan,
          expiresAt: new Date(activeSubscription.current_period_end * 1000),
        },
      });
      console.log("License updated");
    } else {
      // Create new license
      const licenseKey = uuidv4();
      const expiresAt = new Date(activeSubscription.current_period_end * 1000);

      await prisma.license.create({
        data: {
          userId: user.id,
          licenseKey,
          status: "active",
          plan,
          expiresAt,
        },
      });
      console.log("License created");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Subscription und License erfolgreich synchronisiert",
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Test sync error:", error);
    return NextResponse.json(
      { error: "Fehler beim Synchronisieren", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

