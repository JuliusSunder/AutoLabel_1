import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    );
  }
  return stripePromise;
};

export async function redirectToCheckout(priceId: string, plan: string, billingPeriod: string) {
  console.log('redirectToCheckout called:', { priceId, plan, billingPeriod });
  
  try {
    const stripe = await getStripe();
    console.log('Stripe instance:', stripe ? 'loaded' : 'failed');
    
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    console.log('Creating checkout session...');
    // Call API to create checkout session
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        plan,
        billingPeriod,
      }),
    });

    console.log('Checkout session response:', { status: response.status, ok: response.ok });
    const data = await response.json();
    console.log('Checkout session data:', data);

    if (!response.ok) {
      console.error('Checkout session failed:', data);
      throw new Error(data.error || 'Failed to create checkout session');
    }

    // Use the URL directly instead of redirectToCheckout (deprecated)
    if (data.url) {
      console.log('Redirecting to Stripe Checkout URL:', data.url);
      window.location.href = data.url;
    } else {
      throw new Error('Checkout session URL not found');
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    
    // Better error handling
    if (error instanceof Error) {
      console.error('Error details:', { message: error.message, stack: error.stack });
      if (error.message.includes('Nicht authentifiziert') || error.message.includes('401')) {
        alert('Bitte melden Sie sich zuerst an.');
        window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.href);
        return;
      }
      if (error.message.includes('Price ID') || error.message.includes('priceId')) {
        alert('Preis-ID nicht gefunden. Bitte kontaktieren Sie den Support.');
        return;
      }
    }
    
    alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    throw error; // Re-throw so caller can handle it
  }
}

export async function upgradeSubscription(priceId: string, plan: string, billingPeriod: string) {
  console.log('upgradeSubscription called:', { priceId, plan, billingPeriod });
  
  try {
    console.log('Upgrading subscription...');
    const response = await fetch('/api/stripe/upgrade-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        plan,
        billingPeriod,
      }),
    });

    console.log('Upgrade response:', { status: response.status, ok: response.ok });
    const data = await response.json();
    console.log('Upgrade data:', data);

    if (!response.ok) {
      console.error('Upgrade failed:', data);
      throw new Error(data.error || 'Upgrade fehlgeschlagen');
    }

    return data;
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', { message: error.message, stack: error.stack });
    }
    
    throw error;
  }
}

export async function redirectToUpgradeCheckout(priceId: string, plan: string, billingPeriod: string) {
  console.log('redirectToUpgradeCheckout called:', { priceId, plan, billingPeriod });
  
  try {
    const stripe = await getStripe();
    console.log('Stripe instance:', stripe ? 'loaded' : 'failed');
    
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    console.log('Creating upgrade checkout session...');
    // Call API to create upgrade checkout session
    const response = await fetch('/api/stripe/create-upgrade-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        plan,
        billingPeriod,
      }),
    });

    console.log('Upgrade checkout session response:', { status: response.status, ok: response.ok });
    const data = await response.json();
    console.log('Upgrade checkout session data:', data);

    if (!response.ok) {
      console.error('Upgrade checkout session failed:', data);
      throw new Error(data.error || 'Failed to create upgrade checkout session');
    }

    // Use the URL directly to redirect to Stripe Checkout
    if (data.url) {
      console.log('Redirecting to Stripe Upgrade Checkout URL:', data.url);
      window.location.href = data.url;
    } else {
      throw new Error('Upgrade checkout session URL not found');
    }
  } catch (error) {
    console.error('Error redirecting to upgrade checkout:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', { message: error.message, stack: error.stack });
    }
    
    alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    throw error;
  }
}

export async function openCustomerPortal() {
  console.log('openCustomerPortal called');
  
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Portal session failed:', data);
      throw new Error(data.error || 'Failed to create portal session');
    }

    if (data.url) {
      console.log('Redirecting to Stripe Customer Portal:', data.url);
      window.location.href = data.url;
    } else {
      throw new Error('Portal session URL not found');
    }
  } catch (error) {
    console.error('Error opening customer portal:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', { message: error.message, stack: error.stack });
    }
    
    alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    throw error;
  }
}

export { stripePromise };

