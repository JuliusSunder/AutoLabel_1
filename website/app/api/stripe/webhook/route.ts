import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe-server";
import { prisma } from "@/app/lib/prisma";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const isUpgrade = session.metadata?.isUpgrade === "true";
  const existingSubscriptionId = session.metadata?.existingSubscriptionId;
  const targetPlan = session.metadata?.targetPlan;
  const oldPlan = session.metadata?.oldPlan;

  const newSubscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!newSubscriptionId) {
    console.log("No subscription ID in checkout session, skipping");
    return;
  }

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(newSubscriptionId);
  const plan = stripeSubscription.metadata?.plan || targetPlan;
  const billingPeriod = stripeSubscription.metadata?.billingPeriod || "monthly";

  if (!userId || !plan) {
    console.error("Missing metadata in checkout session:", { userId, plan, metadata: session.metadata });
    return;
  }

  // Wenn Upgrade: Alte Subscription kündigen und neue aktivieren
  if (isUpgrade && existingSubscriptionId) {
    console.log(`Upgrade checkout completed. Old subscription: ${existingSubscriptionId}, New subscription: ${newSubscriptionId}`);
    
    try {
      // Kündige alte Subscription sofort
      await stripe.subscriptions.cancel(existingSubscriptionId);
      console.log(`Cancelled old subscription: ${existingSubscriptionId}`);
    } catch (cancelError) {
      console.error(`Error cancelling old subscription ${existingSubscriptionId}:`, cancelError);
      // Fortfahren auch wenn Kündigung fehlschlägt
    }

    // Update bestehende Subscription in Database
    const existingDbSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        stripeSubscriptionId: existingSubscriptionId,
      },
    });

    if (existingDbSubscription) {
      // Update bestehende Subscription mit neuer Stripe Subscription ID
      await prisma.subscription.update({
        where: { id: existingDbSubscription.id },
        data: {
          stripeSubscriptionId: newSubscriptionId,
          status: "active",
          plan,
          billingPeriod,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
      });

      // Update License
      await prisma.license.updateMany({
        where: {
          userId,
          status: "active",
        },
        data: {
          plan,
          expiresAt: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      console.log(`Upgrade completed: ${oldPlan} -> ${plan} for user ${userId}`);
      return;
    }
  }

  // Normale neue Subscription (nicht Upgrade)
  // Update or create subscription
  await prisma.subscription.upsert({
    where: { stripeCustomerId: customerId },
    update: {
      stripeSubscriptionId: newSubscriptionId,
      status: "active",
      plan,
      billingPeriod,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: newSubscriptionId,
      status: "active",
      plan,
      billingPeriod,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  // Create license key (nur bei neuer Subscription, nicht bei Upgrade)
  const licenseKey = uuidv4();
  const expiresAt = new Date(stripeSubscription.current_period_end * 1000);

  await prisma.license.create({
    data: {
      userId,
      licenseKey,
      status: "active",
      plan,
      expiresAt,
    },
  });

  // Send email with license key
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user) {
    console.log(`License key created for ${user.email}: ${licenseKey}`);
    const { sendLicenseEmail } = await import("@/app/lib/email");
    await sendLicenseEmail(user.email, licenseKey, plan, user.name);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const plan = subscription.metadata?.plan || "free";
  const billingPeriod = subscription.metadata?.billingPeriod || "monthly";

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error("Subscription not found for customer:", customerId);
    return;
  }

  // Update subscription INCLUDING plan and billingPeriod
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan: plan.toLowerCase(), // WICHTIG: Plan auch updaten
      billingPeriod: billingPeriod.toLowerCase(), // WICHTIG: Billing Period auch updaten
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update license INCLUDING plan
  await prisma.license.updateMany({
    where: {
      userId: dbSubscription.userId,
      status: "active",
    },
    data: {
      plan: plan.toLowerCase(), // Plan auch in License updaten
      expiresAt: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error("Subscription not found for customer:", customerId);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "cancelled",
    },
  });

  // Revoke active licenses
  await prisma.license.updateMany({
    where: {
      userId: dbSubscription.userId,
      status: "active",
    },
    data: {
      status: "revoked",
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Wenn Invoice für Upgrade bezahlt wurde, aktualisiere Subscription
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    return; // Keine Subscription, keine Aktion nötig
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = stripeSubscription.metadata?.plan || "free";
    const billingPeriod = stripeSubscription.metadata?.billingPeriod || "monthly";

    console.log(`Invoice payment succeeded for subscription: ${subscriptionId}, plan: ${plan}`);

    // Suche nach Subscription mit stripeSubscriptionId ODER stripeCustomerId
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId: subscriptionId },
          { stripeCustomerId: invoice.customer as string },
        ],
      },
    });

    if (dbSubscription) {
      // Update Subscription mit neuem Plan
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          stripeSubscriptionId: subscriptionId, // Stelle sicher, dass Subscription-ID gesetzt ist
          plan: plan.toLowerCase(),
          billingPeriod: billingPeriod.toLowerCase(),
          status: "active",
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      // Update License
      await prisma.license.updateMany({
        where: {
          userId: dbSubscription.userId,
          status: "active",
        },
        data: {
          plan: plan.toLowerCase(),
          expiresAt: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      console.log(`Invoice payment succeeded, subscription updated: ${subscriptionId}, plan: ${plan}`);
    } else {
      console.error(`Subscription not found for invoice payment: subscriptionId=${subscriptionId}, customerId=${invoice.customer}`);
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!dbSubscription) {
    console.error("Subscription not found for customer:", customerId);
    return;
  }

  // Update subscription status to past_due
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "past_due",
    },
  });

  // Send payment failed email
  const user = await prisma.user.findUnique({
    where: { id: dbSubscription.userId },
  });

  if (user) {
    console.log(`Payment failed for ${user.email}`);
    const { sendPaymentFailedEmail } = await import("@/app/lib/email");
    await sendPaymentFailedEmail(user.email, user.name);
  }
}

