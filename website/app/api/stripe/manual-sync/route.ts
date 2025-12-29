import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { stripe } from "@/app/lib/stripe-server";
import { prisma } from "@/app/lib/prisma";
import { v4 as uuidv4 } from "uuid";

/**
 * Manual Sync Endpoint
 * Use this if the webhook didn't fire after successful payment
 * 
 * This endpoint will:
 * 1. Get the user's Stripe customer ID
 * 2. Find the latest subscription
 * 3. Create/update subscription and license in database
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

    const body = await req.json().catch(() => ({}));
    const providedCustomerId = body.customerId as string | undefined;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
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

    console.log("Manual sync request:", {
      userId: user.id,
      email: user.email,
      existingCustomerId: user.subscriptions[0]?.stripeCustomerId,
      providedCustomerId,
    });

    // Get Stripe customer ID from provided parameter, existing subscription, or find by email
    let stripeCustomerId = providedCustomerId || user.subscriptions[0]?.stripeCustomerId;

    if (!stripeCustomerId || stripeCustomerId === "") {
      // Try to find customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 10, // Increase limit to find the right customer
      });

      console.log("Searching for customers by email:", user.email, "Found:", customers.data.length);

      if (customers.data.length > 0) {
        // Try to find customer with active subscription
        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: "all",
            limit: 10,
          });
          
          console.log(`Customer ${customer.id} has ${subscriptions.data.length} subscriptions`);
          
          if (subscriptions.data.length > 0) {
            stripeCustomerId = customer.id;
            console.log("Found Stripe customer with subscription:", stripeCustomerId);
            break;
          }
        }
        
        // If no customer with subscription found, use the first one
        if (!stripeCustomerId && customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          console.log("Found Stripe customer by email (no subscription yet):", stripeCustomerId);
        }
      }
      
      if (!stripeCustomerId) {
        // No customer found - check if there are any subscriptions at all
        // Maybe the subscription was created with a different email
        // Let's search for recent checkout sessions
        const sessions = await stripe.checkout.sessions.list({
          limit: 100, // Increase limit
        });

        console.log("Searching checkout sessions, found:", sessions.data.length);

        // Find session with this user's email or userId in metadata
        const userSession = sessions.data.find(
          (s) => 
            s.customer_email === user.email || 
            s.customer_details?.email === user.email ||
            s.metadata?.userId === user.id
        );

        if (userSession && userSession.customer) {
          stripeCustomerId = userSession.customer as string;
          console.log("Found Stripe customer from checkout session:", stripeCustomerId);
        } else {
          return NextResponse.json(
            { 
              error: "Keine Stripe Customer ID gefunden. Bitte stelle sicher, dass du die Zahlung mit dieser Email-Adresse durchgeführt hast.",
              hint: `Falls du mit einer anderen Email bezahlt hast, logge dich mit dieser Email ein. Deine aktuelle Email: ${user.email}`
            },
            { status: 404 }
          );
        }
      }
    }

    // Get all subscriptions for this customer
    let stripeSubscriptions;
    try {
      stripeSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 10,
      });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json(
        { error: "Fehler beim Abrufen der Subscriptions von Stripe" },
        { status: 500 }
      );
    }

    if (stripeSubscriptions.data.length === 0) {
      return NextResponse.json(
        { 
          error: "Keine Subscription in Stripe gefunden",
          hint: "Bitte überprüfe in deinem Stripe Dashboard, ob die Zahlung erfolgreich war und ob eine Subscription erstellt wurde."
        },
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
      customerId: stripeCustomerId,
      subscriptionId: activeSubscription.id,
      plan,
      billingPeriod,
    });

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { stripeCustomerId: stripeCustomerId },
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
        stripeCustomerId: stripeCustomerId,
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
    console.error("Manual sync error:", error);
    return NextResponse.json(
      { error: "Fehler beim Synchronisieren" },
      { status: 500 }
    );
  }
}

