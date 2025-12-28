import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export async function redirectToCheckout(priceId: string) {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // In production, this would call your API to create a checkout session
    // For now, we'll just log the intent
    console.log('Would redirect to checkout for price:', priceId);
    
    // Placeholder: In production, you'd do:
    // const { error } = await stripe.redirectToCheckout({
    //   lineItems: [{ price: priceId, quantity: 1 }],
    //   mode: 'subscription',
    //   successUrl: `${window.location.origin}/success`,
    //   cancelUrl: `${window.location.origin}/cancel`,
    // });
    
    alert('Stripe checkout is not yet configured. Please add your Stripe keys to .env.local');
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
  }
}

export { stripePromise };

