# AutoLabel Website Setup Guide

Dieses Dokument beschreibt die Einrichtung des vollständigen Login-Systems, Stripe Payment Integration und App-Download-Systems für die AutoLabel Website.

## 🚀 Installation

### 1. Dependencies installieren

```bash
cd website
npm install
```

### 2. Environment Variables einrichten

Kopieren Sie `.env.local.example` nach `.env.local` und füllen Sie die Werte aus:

```bash
cp .env.local.example .env.local
```

Erforderliche Environment Variables:

#### Database
- `DATABASE_URL`: SQLite Datenbank-Pfad (z.B. `file:./dev.db`)

#### NextAuth.js
- `NEXTAUTH_SECRET`: Generieren mit `openssl rand -base64 32`
- `NEXTAUTH_URL`: Ihre App-URL (z.B. `http://localhost:3000`)

#### Stripe
- `STRIPE_SECRET_KEY`: Stripe Secret Key (sk_test_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe Publishable Key (pk_test_...)
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Secret (whsec_...)
- Price IDs für Ihre Stripe Products:
  - `STRIPE_PRICE_ID_PLUS_MONTHLY`
  - `STRIPE_PRICE_ID_PLUS_YEARLY`
  - `STRIPE_PRICE_ID_PRO_MONTHLY`
  - `STRIPE_PRICE_ID_PRO_YEARLY`

#### Email (Resend)
- `RESEND_API_KEY`: Resend API Key
- `EMAIL_FROM`: Absender-Email (z.B. `noreply@autolabel.com`)

#### App Download
- `APP_DOWNLOAD_URL`: URL zum Installer (z.B. GitHub Release)

### 3. Prisma Setup

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank erstellen und Migrations ausführen
npx prisma db push

# Optional: Prisma Studio öffnen (Database GUI)
npx prisma studio
```

### 4. Stripe Setup

#### Stripe Products erstellen

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com)
2. Erstellen Sie Products für "Plus" und "Pro" Pläne
3. Erstellen Sie Prices für monatliche und jährliche Abrechnung
4. Kopieren Sie die Price IDs in `.env.local`

#### Stripe Webhook einrichten

1. Gehen Sie zu Stripe Dashboard → Developers → Webhooks
2. Erstellen Sie einen neuen Webhook Endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
3. Kopieren Sie den Webhook Secret in `.env.local`

**Für lokale Entwicklung:**

```bash
# Stripe CLI installieren
# https://stripe.com/docs/stripe-cli

# Webhook forwarding starten
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Webhook Secret wird angezeigt - kopieren Sie ihn in .env.local
```

### 5. Resend Setup

1. Erstellen Sie einen Account bei [Resend](https://resend.com)
2. Erstellen Sie einen API Key
3. Verifizieren Sie Ihre Domain (für Production)
4. Kopieren Sie den API Key in `.env.local`

### 6. Development Server starten

```bash
npm run dev
```

Die Website läuft jetzt auf `http://localhost:3000`

## 📁 Projektstruktur

```
website/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth Handler
│   │   │   ├── register/route.ts       # User Registration
│   │   │   └── session/route.ts        # Session Info
│   │   ├── stripe/
│   │   │   ├── create-checkout-session/route.ts
│   │   │   └── webhook/route.ts        # Stripe Webhooks
│   │   ├── download/
│   │   │   └── app/route.ts            # App Download
│   │   └── send-email/route.ts         # Email Versand
│   ├── components/
│   │   └── sections/
│   │       └── Navigation.tsx          # Navigation mit Login/User Menu
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth Config
│   │   ├── prisma.ts                   # Prisma Client
│   │   ├── stripe.ts                   # Stripe Client-side
│   │   ├── stripe-server.ts            # Stripe Server-side
│   │   └── email.ts                    # Email Templates
│   ├── login/page.tsx                  # Login Page
│   ├── register/page.tsx               # Register Page
│   ├── dashboard/page.tsx              # User Dashboard
│   ├── download/page.tsx               # Download Page
│   └── success/page.tsx                # Payment Success
├── prisma/
│   └── schema.prisma                   # Database Schema
├── middleware.ts                       # Protected Routes
└── types/
    └── next-auth.d.ts                  # NextAuth Types
```

## 🔐 Features

### User Authentication
- ✅ User Registration mit Email/Password
- ✅ User Login mit NextAuth.js
- ✅ Session Management
- ✅ Protected Routes (Dashboard, Download)
- ✅ Password Hashing mit bcrypt

### Stripe Payment Integration
- ✅ Checkout Session erstellen
- ✅ Webhook Handler für Payment Events
- ✅ Subscription Management
- ✅ Automatische License Key Generierung
- ✅ Payment Status Tracking

### License Key System
- ✅ Automatische Generierung (UUID v4)
- ✅ Speicherung in Database
- ✅ Status Tracking (active, revoked, expired)
- ✅ Expiration Date Management

### Email Integration
- ✅ Welcome Email nach Registration
- ✅ License Key Email nach Payment
- ✅ Payment Failed Email
- ✅ Resend Integration

### User Dashboard
- ✅ Subscription Status anzeigen
- ✅ License Key anzeigen und kopieren
- ✅ App Download Button
- ✅ Account Management

## 🧪 Testing

### Lokales Testing mit Stripe

1. Verwenden Sie Stripe Test Mode
2. Test Card Numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Verwenden Sie beliebige zukünftige Daten für Expiry
4. Verwenden Sie beliebige 3-stellige CVC

### Webhook Testing

```bash
# Stripe CLI forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test Events manuell triggern
stripe trigger checkout.session.completed
```

## 🚀 Production Deployment

### Vor dem Deployment

1. ✅ Alle Environment Variables in Production setzen
2. ✅ Stripe Webhook URL auf Production-Domain ändern
3. ✅ Resend Domain verifizieren
4. ✅ Database auf PostgreSQL umstellen (empfohlen)
5. ✅ NEXTAUTH_URL auf Production-Domain setzen

### Database Migration (SQLite → PostgreSQL)

1. Ändern Sie `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. Ändern Sie `provider` in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Führen Sie Migration aus:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### Deployment Checklist

- [ ] Environment Variables gesetzt
- [ ] Database migriert
- [ ] Stripe Webhooks konfiguriert
- [ ] Resend Domain verifiziert
- [ ] App Download URL gesetzt
- [ ] CORS Settings geprüft
- [ ] SSL/HTTPS aktiviert

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User Registration
- `POST /api/auth/[...nextauth]` - NextAuth Handlers
- `GET /api/auth/session` - Session Info

### Stripe
- `POST /api/stripe/create-checkout-session` - Checkout Session erstellen
- `POST /api/stripe/webhook` - Stripe Webhooks

### Download
- `GET /api/download/app` - App Download (Protected)

### Email
- `POST /api/send-email` - Email senden

## 🔧 Troubleshooting

### Prisma Errors
```bash
# Client neu generieren
npx prisma generate

# Database zurücksetzen
npx prisma db push --force-reset
```

### Stripe Webhook Errors
- Prüfen Sie `STRIPE_WEBHOOK_SECRET`
- Prüfen Sie Webhook Events in Stripe Dashboard
- Verwenden Sie `stripe listen` für lokales Testing

### Email Errors
- Prüfen Sie `RESEND_API_KEY`
- Verifizieren Sie Domain in Resend
- Prüfen Sie Email Logs in Resend Dashboard

## 📚 Weitere Ressourcen

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Stripe Docs](https://stripe.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Resend Docs](https://resend.com/docs)

## 🆘 Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Logs in der Console
2. Prüfen Sie die Stripe Dashboard Events
3. Prüfen Sie die Resend Dashboard Logs
4. Öffnen Sie ein Issue im Repository

