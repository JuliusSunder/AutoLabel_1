/**
 * Manual Subscription Creation Script
 * Use this if the webhook didn't fire after successful payment
 * 
 * Usage:
 * 1. Get the checkout session ID from Stripe Dashboard
 * 2. Run: npx tsx scripts/manual-subscription.ts <session_id>
 */

import { prisma } from '../app/lib/prisma';
import { stripe } from '../app/lib/stripe-server';
import { v4 as uuidv4 } from 'uuid';

async function createSubscriptionFromSession(sessionId: string) {
  try {
    console.log('Fetching checkout session:', sessionId);
    
    // Get checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    console.log('Session data:', {
      id: session.id,
      customer: session.customer,
      subscription: session.subscription,
      metadata: session.metadata,
    });

    if (!session.subscription) {
      throw new Error('No subscription found in session');
    }

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const billingPeriod = session.metadata?.billingPeriod;

    if (!userId || !plan || !billingPeriod) {
      throw new Error('Missing metadata in session');
    }

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const customerId = session.customer as string;

    console.log('Creating/updating subscription...');
    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: {
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
        plan,
        billingPeriod,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      create: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
        plan,
        billingPeriod,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    console.log('Subscription created/updated:', subscription.id);

    // Check if license already exists
    const existingLicense = await prisma.license.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    if (existingLicense) {
      console.log('License already exists:', existingLicense.id);
      // Update existing license
      await prisma.license.update({
        where: { id: existingLicense.id },
        data: {
          plan,
          expiresAt: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
      console.log('License updated');
    } else {
      console.log('Creating new license...');
      // Create license key
      const licenseKey = uuidv4();
      const expiresAt = new Date(stripeSubscription.current_period_end * 1000);

      const license = await prisma.license.create({
        data: {
          userId,
          licenseKey,
          status: 'active',
          plan,
          expiresAt,
        },
      });

      console.log('License created:', license.id);
      console.log('License Key:', licenseKey);
    }

    console.log('✅ Success! Subscription and license created/updated.');
    console.log('Please refresh your dashboard.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get session ID from command line
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('Usage: npx tsx scripts/manual-subscription.ts <session_id>');
  console.error('Example: npx tsx scripts/manual-subscription.ts cs_test_...');
  process.exit(1);
}

createSubscriptionFromSession(sessionId);

