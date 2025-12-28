# AutoLabel Landing Page

Modern, minimalist landing page for AutoLabel - the desktop app for automated shipping label processing.

## Features

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **Stripe Integration** (prepared, not fully configured)
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **SEO Optimized** - Meta tags, semantic HTML

## Project Structure

```
website/
├── app/
│   ├── components/
│   │   ├── sections/      # Main page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── Problem.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── FAQ.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/            # Reusable UI components
│   │       ├── Button.tsx
│   │       └── Container.tsx
│   ├── lib/
│   │   └── stripe.ts      # Stripe checkout logic
│   ├── success/           # Payment success page
│   ├── cancel/            # Payment cancel page
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main landing page
│   └── globals.css        # Global styles
├── public/
│   └── images/
│       └── labels/        # Label example images
├── tailwind.config.ts     # Tailwind configuration
└── next.config.ts         # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the website directory:
```bash
cd website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Stripe keys (optional for development)
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The page will auto-reload when you make changes.

### Build

Build the production version:

```bash
npm run build
```

### Start Production Server

After building, start the production server:

```bash
npm start
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Stripe Integration

The Stripe integration is prepared but not fully configured. To enable payments:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products and prices in the Stripe Dashboard
3. Add the price IDs to your `.env.local` file
4. Update `app/lib/stripe.ts` to implement the full checkout flow

For now, clicking "Buy" buttons will show a placeholder alert.

## Design System

### Colors

- **Primary**: Gray tones (#1f2937, #374151, #6b7280)
- **Accent**: Teal (#007782) - matches the Electron app
- **Background**: White (#ffffff) with subtle gray sections

### Typography

- System font stack for optimal performance
- Headlines: Bold, 2.5rem-3rem
- Body: Regular, 1rem-1.125rem

### Spacing

- Section padding: 4rem-6rem (py-16 to py-24)
- Container max-width: 1200px

## Page Sections

1. **Hero** - Main headline, CTA buttons, label examples
2. **Problem** - 3 pain points for resellers
3. **How It Works** - 4-step process explanation
4. **Features** - 6 key features in a grid
5. **Pricing** - 3 pricing tiers with monthly/yearly toggle
6. **FAQ** - 7 frequently asked questions
7. **Footer** - Links and copyright

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Self-hosted with Node.js

## Customization

### Changing Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  accent: {
    DEFAULT: "#007782",  // Change this
    // ...
  },
}
```

### Adding Sections

1. Create a new component in `app/components/sections/`
2. Import and add it to `app/page.tsx`

### Modifying Content

All content is in the section components. Edit the text directly in:
- `app/components/sections/Hero.tsx`
- `app/components/sections/Problem.tsx`
- etc.

## License

MIT

## Support

For questions or issues, please contact support@autolabel.com (placeholder)
