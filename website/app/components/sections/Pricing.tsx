'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Check, CheckCircle2, Info } from 'lucide-react';
import { redirectToCheckout, redirectToUpgradeCheckout, openCustomerPortal, upgradeSubscription } from '@/app/lib/stripe';

const pricingPlans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for trying out AutoLabel',
    features: [
      '10 labels per month',
      'Email scanning',
      'Label normalization',
      'Basic support',
    ],
    limitations: [
      'No batch printing',
      'Limited to 10 labels/month',
    ],
    cta: 'Get Started',
    priceId: null,
    popular: false,
  },
  {
    name: 'Plus',
    price: { monthly: 7.99, yearly: 6.39 },
    description: 'For growing resellers',
    features: [
      '60 labels per month',
      'Email scanning',
      'Label normalization',
      'Batch printing',
      'Custom footer',
      'Priority support',
    ],
    limitations: [],
    cta: 'Start Plus',
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_YEARLY,
    },
    popular: true,
  },
  {
    name: 'Pro',
    price: { monthly: 18.99, yearly: 15.19 },
    description: 'For professional resellers',
    features: [
      'Unlimited labels',
      'Email scanning',
      'Label normalization',
      'Batch printing',
      'Custom footer',
      'Multiple email accounts',
      'Advanced analytics',
      'Premium support',
    ],
    limitations: [],
    cta: 'Start Pro',
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY,
    },
    popular: false,
  },
];

export function Pricing() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    // Debug: Log price IDs
    console.log('Price IDs:', {
      plusMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY,
      plusYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_YEARLY,
      proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
      proYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY,
    });

    // Check if user is authenticated and get current plan
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        console.log('Auth check result:', { hasUser: !!data.user, user: data.user });
        setIsAuthenticated(!!data.user);
        
        // Get current plan from subscription
        if (data.user?.subscription?.plan) {
          setCurrentPlan(data.user.subscription.plan.toLowerCase());
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleCheckout = async (priceId: string | null, plan: string) => {
    console.log('handleCheckout called:', { priceId, plan, billingPeriod, isAuthenticated, currentPlan });
    
    if (!priceId) {
      console.warn('No priceId provided, redirecting to register');
      // Free plan - redirect to register
      router.push('/register');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=${encodeURIComponent('/#pricing')}`);
      return;
    }

    const planLower = plan.toLowerCase();
    
    // Check if an active subscription already exists
    if (currentPlan && currentPlan !== 'free') {
      // Upgrade flow: Use checkout session instead of direct upgrade
      console.log('Creating upgrade checkout session...');
      setIsLoading(true);
      try {
        await redirectToUpgradeCheckout(priceId, planLower, billingPeriod);
        // redirectToUpgradeCheckout redirects automatically, so no reload needed
      } catch (error) {
        console.error('Upgrade checkout error:', error);
        if (error instanceof Error) {
          if (error.message.includes('bereits diesen Plan') || error.message.includes('already have this plan')) {
            alert('You already have this plan.');
          } else if (error.message.includes('Downgrade')) {
            alert(error.message);
          } else {
            alert(`Upgrade failed: ${error.message}`);
          }
        } else {
          alert('An error occurred. Please try again.');
        }
        setIsLoading(false);
      }
    } else {
      // Create new subscription
      console.log('Starting checkout process...');
      setIsLoading(true);
      try {
        await redirectToCheckout(priceId, planLower, billingPeriod);
      } catch (error) {
        console.error('Checkout error:', error);
        if (error instanceof Error && (error.message.includes('Upgrade-Funktion') || error.message.includes('upgrade function'))) {
          // Fallback: Try upgrade if checkout says upgrade needed
          try {
            const result = await upgradeSubscription(priceId, planLower, billingPeriod);
            alert(`Upgrade successful! Your plan has been updated to ${plan}.`);
            window.location.reload();
          } catch (upgradeError) {
            alert('An error occurred. Please try again.');
          }
        } else {
          alert('An error occurred. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <section id="pricing" className="py-16 md:py-24 bg-gray-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-primary-lighter max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include core features.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-vinted text-white'
                  : 'text-primary-lighter hover:text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-vinted text-white'
                  : 'text-primary-lighter hover:text-primary'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-accent-lighter text-vinted px-2 py-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg p-8 ${
                plan.popular && currentPlan !== plan.name.toLowerCase()
                  ? 'ring-2 ring-vinted shadow-xl scale-105'
                  : currentPlan === plan.name.toLowerCase()
                  ? 'ring-2 ring-green-500 shadow-xl'
                  : currentPlan === 'plus' && plan.name.toLowerCase() === 'pro'
                  ? 'ring-2 ring-green-500 shadow-xl'
                  : 'shadow-md'
              } relative`}
            >
              {plan.popular && currentPlan !== plan.name.toLowerCase() && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-vinted text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              {currentPlan === plan.name.toLowerCase() && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Your Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-primary-lighter mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-primary">
                    €{plan.price[billingPeriod].toFixed(2)}
                  </span>
                  <span className="text-primary-lighter ml-2">
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                  <p className="text-xs text-vinted mt-1">
                    €{(plan.price.yearly * 12).toFixed(2)} billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-vinted mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-primary-light">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-start opacity-50">
                    <span className="text-sm text-primary-lighter line-through">
                      {limitation}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button oder Status-Anzeige */}
              {(() => {
                const planNameLower = plan.name.toLowerCase();
                const isCurrentPlan = currentPlan === planNameLower;
                const isUpgrade = currentPlan === 'plus' && planNameLower === 'pro';
                
                // Prüfe ob Downgrade (Pro → Plus)
                const planHierarchy = { free: 0, plus: 1, pro: 2 };
                const currentPlanLevel = currentPlan ? (planHierarchy[currentPlan as keyof typeof planHierarchy] ?? 0) : 0;
                const targetPlanLevel = planHierarchy[planNameLower as keyof typeof planHierarchy] ?? 0;
                const isDowngrade = currentPlanLevel > targetPlanLevel;
                
                if (isCurrentPlan) {
                  // User hat bereits diesen Plan
                  return (
                    <div className="w-full">
                      <Button
                        variant="outline"
                        className="w-full bg-green-50 border-green-500 text-green-700 hover:bg-green-100 cursor-default"
                        disabled={true}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Already Active
                      </Button>
                    </div>
                  );
                }
                
                if (isDowngrade) {
                  // Downgrade nicht erlaubt
                  return (
                    <div className="w-full">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-gray-600">
                            <p>Downgrade not possible. You can only upgrade to a higher plan.</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                        disabled={true}
                      >
                        Not Available
                      </Button>
                    </div>
                  );
                }
                
                if (isUpgrade) {
                  // Upgrade von Plus auf Pro mit Erstattungshinweis
                  return (
                    <div className="w-full space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-800">
                            <p className="font-semibold mb-1">Upgrade Bonus:</p>
                            <p>You will receive an automatic refund for the unused portion of your Plus plan. The refund is calculated based on the days already used.</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600 mb-2"
                        onClick={() => {
                          const selectedPriceId = plan.priceId 
                            ? (billingPeriod === 'monthly' ? plan.priceId.monthly : plan.priceId.yearly) || null
                            : null;
                          
                          console.log('Button clicked:', { plan: plan.name, selectedPriceId, billingPeriod });
                          handleCheckout(selectedPriceId, plan.name);
                        }}
                        disabled={!!(isLoading || (plan.priceId && isAuthenticated !== true))}
                      >
                        {isLoading ? 'Loading...' : `Upgrade to ${plan.name}`}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          try {
                            await openCustomerPortal();
                          } catch (error) {
                            console.error('Error opening portal:', error);
                          }
                        }}
                        disabled={isLoading}
                      >
                        Update Payment Method
                      </Button>
                    </div>
                  );
                }
                
                // Normale Checkout-Button
                return (
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => {
                      const selectedPriceId = plan.priceId 
                        ? (billingPeriod === 'monthly' ? plan.priceId.monthly : plan.priceId.yearly) || null
                        : null;
                      console.log('Button clicked:', { plan: plan.name, selectedPriceId, billingPeriod });
                      handleCheckout(selectedPriceId, plan.name);
                    }}
                    disabled={!!(isLoading || (plan.priceId && isAuthenticated !== true))}
                  >
                    {isLoading ? 'Loading...' : plan.cta}
                  </Button>
                );
              })()}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

