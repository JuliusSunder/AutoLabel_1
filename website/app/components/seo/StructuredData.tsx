'use client';

export function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolabel.app';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AutoLabel",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Windows, macOS",
    "description": "Automate your shipping label processing. Scan emails, normalize labels to 100×150mm (4×6\"), and print in bulk - all automatically. Perfect for resellers on Vinted, eBay, and other platforms.",
    "url": baseUrl,
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "lowPrice": "0",
      "highPrice": "18.99",
      "offerCount": "3",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0",
          "priceCurrency": "EUR",
          "description": "Perfect for trying out AutoLabel with basic features"
        },
        {
          "@type": "Offer",
          "name": "Plus Plan",
          "price": "9.99",
          "priceCurrency": "EUR",
          "billingDuration": "P1M",
          "description": "For growing resellers with advanced features"
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "18.99",
          "priceCurrency": "EUR",
          "billingDuration": "P1M",
          "description": "For professional resellers with unlimited processing"
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "3",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Automatic email scanning (IMAP)",
      "Label normalization to 100×150mm (4×6\")",
      "Batch printing",
      "Support for DHL, Hermes, DPD, GLS, UPS",
      "Works with Vinted, eBay, Kleiderkreisel",
      "Custom footer support",
      "Print queue management",
      "Local SQLite database"
    ],
    "screenshot": `${baseUrl}/logo/logo.png`,
    "softwareVersion": "1.0",
    "author": {
      "@type": "Organization",
      "name": "AutoLabel"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AutoLabel"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

