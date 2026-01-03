/**
 * Create Test Subscription Script
 * Creates a test subscription directly in the database for testing purposes
 * 
 * Usage:
 * npx tsx scripts/create-test-subscription.ts <user-email> <plan>
 * 
 * Example:
 * npx tsx scripts/create-test-subscription.ts test@example.com plus
 */

import { prisma } from '../app/lib/prisma';
import { stripe } from '../app/lib/stripe-server';
import { v4 as uuidv4 } from 'uuid';

async function createTestSubscription(email: string, plan: 'plus' | 'pro') {
  try {
    console.log(`Creating test subscription for ${email} with plan ${plan}...`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscriptions: true },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found. Please register first.`);
    }

    console.log('User found:', user.id);

    // Create Stripe customer if needed
    let stripeCustomerId = user.subscriptions[0]?.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log('Creating Stripe test customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log('Stripe customer created:', stripeCustomerId);
    }

    // Create Stripe test subscription
    console.log('Creating Stripe test subscription...');
    
    // Use test price IDs (you need to set these in your .env.local)
    const priceId = plan === 'plus' 
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY 
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY;

    if (!priceId) {
      throw new Error(`Price ID for ${plan} not found in environment variables`);
    }

    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      metadata: {
        userId: user.id,
        plan,
        billingPeriod: 'monthly',
      },
    });

    console.log('Stripe subscription created:', stripeSubscription.id);

    // Create/update subscription in database
    const subscription = await prisma.subscription.upsert({
      where: { stripeCustomerId },
      update: {
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
        plan,
        billingPeriod: 'monthly',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: user.id,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'active',
        plan,
        billingPeriod: 'monthly',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      },
    });

    console.log('Database subscription created/updated:', subscription.id);

    // Create or update license
    // First, try to find an existing active license for this user
    let license = await prisma.license.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    if (license) {
      // Update existing license
      license = await prisma.license.update({
        where: { id: license.id },
        data: {
          plan,
          expiresAt: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
      console.log('License updated:', license.id);
      console.log('License Key:', license.licenseKey);
    } else {
      // Create new license
      const licenseKey = uuidv4();
      license = await prisma.license.create({
        data: {
          userId: user.id,
          licenseKey,
          status: 'active',
          plan,
          expiresAt: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
      console.log('License created:', license.id);
      console.log('License Key:', licenseKey);
    }

    console.log('\n✅ Success!');
    console.log('\nTest Subscription Details:');
    console.log('- User:', user.email);
    console.log('- Plan:', plan);
    console.log('- Stripe Customer ID:', stripeCustomerId);
    console.log('- Stripe Subscription ID:', stripeSubscription.id);
    console.log('- License Key:', license.licenseKey);
    console.log('\nYou can now:');
    console.log('1. Login to the dashboard');
    console.log('2. Click "Manage Subscription"');
    console.log('3. Test cancellation and other features');
    console.log('\nCustomer Portal Link:', `https://billing.stripe.com/p/login/00wfZgeBP3Hg9Vf417cwg00`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const email = process.argv[2];
const plan = process.argv[3] as 'plus' | 'pro';

if (!email || !plan || !['plus', 'pro'].includes(plan)) {
  console.error('Usage: npx tsx scripts/create-test-subscription.ts <email> <plan>');
  console.error('Example: npx tsx scripts/create-test-subscription.ts test@example.com plus');
  console.error('\nPlans: plus, pro');
  process.exit(1);
}

createTestSubscription(email, plan);

