'use client';

import { useState } from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';
import { redirectToCheckout } from '@/app/lib/stripe';

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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleCheckout = (priceId: string | null) => {
    if (!priceId) {
      alert('Free plan - no payment needed. Download the app to get started!');
      return;
    }
    redirectToCheckout(priceId);
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
                plan.popular
                  ? 'ring-2 ring-vinted shadow-xl scale-105'
                  : 'shadow-md'
              } relative`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-vinted text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
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

              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => handleCheckout(
                  plan.priceId 
                    ? (billingPeriod === 'monthly' ? plan.priceId.monthly : plan.priceId.yearly) || null
                    : null
                )}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

