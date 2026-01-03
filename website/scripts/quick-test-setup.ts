/**
 * Quick Test Setup
 * Creates a test user with subscription in one command
 * 
 * Usage:
 * npx tsx scripts/quick-test-setup.ts
 */

import { prisma } from '../app/lib/prisma';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function quickTestSetup() {
  try {
    const testEmail = 'test@autolabel.com';
    const testPassword = 'test1234';
    const plan = 'plus';

    console.log('🚀 Quick Test Setup for Subscription Management');
    console.log('================================================\n');

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { subscriptions: true, licenses: true },
    });

    if (user) {
      console.log('✅ Test user already exists:', testEmail);
      console.log('   User ID:', user.id);
    } else {
      console.log('Creating test user...');
      const hashedPassword = await hash(testPassword, 10);
      
      user = await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          name: 'Test User',
          hasCompletedOnboarding: true,
        },
        include: { subscriptions: true, licenses: true },
      });
      
      console.log('✅ Test user created:', testEmail);
      console.log('   Password:', testPassword);
    }

    // Check if subscription exists
    let subscription = user.subscriptions.find(s => s.status === 'active');

    if (subscription) {
      console.log('✅ Active subscription already exists');
      console.log('   Plan:', subscription.plan);
      console.log('   Status:', subscription.status);
    } else {
      console.log('\nCreating test subscription (without Stripe)...');
      
      // Create fake Stripe IDs for testing
      const fakeCustomerId = `cus_test_${uuidv4().substring(0, 8)}`;
      const fakeSubscriptionId = `sub_test_${uuidv4().substring(0, 8)}`;
      
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: fakeCustomerId,
          stripeSubscriptionId: fakeSubscriptionId,
          status: 'active',
          plan,
          billingPeriod: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      console.log('✅ Test subscription created (database only)');
      console.log('   Plan:', plan);
      console.log('   Expires:', periodEnd.toLocaleDateString());
    }

    // Check if license exists
    let license = user.licenses.find(l => l.status === 'active');

    if (license) {
      console.log('✅ Active license already exists');
      console.log('   License Key:', license.licenseKey);
    } else {
      console.log('\nCreating test license...');
      
      const licenseKey = uuidv4();
      const expiresAt = subscription.currentPeriodEnd;

      license = await prisma.license.create({
        data: {
          userId: user.id,
          licenseKey,
          status: 'active',
          plan,
          expiresAt,
        },
      });

      console.log('✅ Test license created');
      console.log('   License Key:', licenseKey);
    }

    console.log('\n================================================');
    console.log('🎉 Setup Complete!\n');
    console.log('📋 Test Credentials:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('   Plan:', subscription.plan.toUpperCase());
    console.log('   License:', license.licenseKey);
    console.log('\n🔗 Next Steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Login at: http://localhost:3000/login');
    console.log('3. Go to Dashboard: http://localhost:3000/dashboard');
    console.log('4. Click "Manage Subscription" to test');
    console.log('\n⚠️  Note: This creates a database-only subscription.');
    console.log('   For full Stripe integration testing, use:');
    console.log('   npx tsx scripts/create-test-subscription.ts test@autolabel.com plus');
    console.log('\n💡 To test with real Stripe Customer Portal:');
    console.log('   - Use Stripe test credit card: 4242 4242 4242 4242');
    console.log('   - Go through checkout flow on pricing page');
    console.log('   - Then test "Manage Subscription" button');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

quickTestSetup();

