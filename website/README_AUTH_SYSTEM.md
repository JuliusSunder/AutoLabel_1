# AutoLabel Authentication & Payment System

Vollständiges Login-System, Stripe Payment Integration und App-Download-System für die AutoLabel Website.

## ✨ Features

### 🔐 User Authentication
- **User Registration**: Email/Password mit Validierung
- **User Login**: NextAuth.js mit Credentials Provider
- **Session Management**: JWT-basierte Sessions
- **Protected Routes**: Middleware für Dashboard und Download
- **Password Security**: bcrypt Hashing

### 💳 Stripe Payment Integration
- **Checkout Sessions**: Vollständig integriert
- **Webhook Handler**: Automatische Verarbeitung von Payment Events
- **Subscription Management**: Active, Cancelled, Past Due Status
- **Automatische License Key Generierung**: UUID v4
- **Payment Status Tracking**: Real-time Updates

### 🔑 License Key System
- **Automatische Generierung**: Nach erfolgreichem Payment
- **Status Tracking**: Active, Revoked, Expired
- **Expiration Management**: Basierend auf Subscription Period
- **Copy-to-Clipboard**: Einfaches Kopieren im Dashboard

### 📧 Email Integration (Resend)
- **Welcome Email**: Nach Registration
- **License Key Email**: Nach Payment mit Download-Link
- **Payment Failed Email**: Bei fehlgeschlagener Zahlung
- **Professional Templates**: HTML-formatiert

### 📱 User Dashboard
- **Subscription Status**: Aktueller Plan und Billing Period
- **License Key Display**: Mit Copy-Button
- **Download Button**: Direkter Zugriff auf App
- **Account Management**: Logout und Profile

### 📥 App Download System
- **Protected Download**: Nur für User mit gültiger License
- **License Validation**: Prüfung von Status und Expiration
- **Download Page**: Mit Installationsanleitung
- **Direct Download**: Von GitHub Releases oder S3

## 📁 Dateistruktur

```
website/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts     # NextAuth Handler
│   │   │   ├── register/route.ts          # User Registration API
│   │   │   └── session/route.ts           # Session Info API
│   │   ├── stripe/
│   │   │   ├── create-checkout-session/route.ts  # Checkout API
│   │   │   └── webhook/route.ts           # Stripe Webhooks
│   │   ├── download/
│   │   │   └── app/route.ts               # App Download API
│   │   └── send-email/route.ts            # Email Versand API
│   ├── components/
│   │   ├── sections/
│   │   │   ├── Navigation.tsx             # Navigation mit Login/User Menu
│   │   │   └── Pricing.tsx                # Pricing mit Stripe Integration
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Container.tsx
│   ├── lib/
│   │   ├── auth.ts                        # NextAuth Konfiguration
│   │   ├── prisma.ts                      # Prisma Client Singleton
│   │   ├── stripe.ts                      # Stripe Client-side
│   │   ├── stripe-server.ts               # Stripe Server-side
│   │   └── email.ts                       # Email Templates (Resend)
│   ├── login/page.tsx                     # Login Page
│   ├── register/page.tsx                  # Registration Page
│   ├── dashboard/page.tsx                 # User Dashboard
│   ├── download/page.tsx                  # Download Page
│   ├── success/page.tsx                   # Payment Success Page
│   └── cancel/page.tsx                    # Payment Cancel Page
├── prisma/
│   └── schema.prisma                      # Database Schema
├── middleware.ts                          # Protected Routes Middleware
├── types/
│   └── next-auth.d.ts                     # NextAuth TypeScript Types
├── scripts/
│   ├── setup.sh                           # Setup Script (Linux/Mac)
│   └── setup.ps1                          # Setup Script (Windows)
├── .env.local.example                     # Environment Variables Template
├── SETUP.md                               # Detaillierte Setup-Anleitung
└── README_AUTH_SYSTEM.md                  # Diese Datei
```

## 🗄️ Database Schema

### Users Table
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   # bcrypt hashed
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  subscriptions Subscription[]
  licenses      License[]
}
```

### Subscriptions Table
```prisma
model Subscription {
  id                   String   @id @default(uuid())
  userId               String
  stripeCustomerId     String   @unique
  stripeSubscriptionId String?  @unique
  status               String   # active, cancelled, past_due, trialing
  plan                 String   # free, plus, pro
  billingPeriod        String?  # monthly, yearly
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

### Licenses Table
```prisma
model License {
  id         String    @id @default(uuid())
  userId     String
  licenseKey String    @unique @default(uuid())
  status     String    # active, revoked, expired
  plan       String    # plus, pro
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

## 🔄 Payment Flow

1. **User klickt auf "Get Started"** in Pricing Section
2. **Redirect zu Login/Register** (falls nicht eingeloggt)
3. **Stripe Checkout Session** wird erstellt
4. **User zahlt** bei Stripe
5. **Webhook empfängt** `checkout.session.completed`
6. **System erstellt**:
   - Subscription in Database
   - License Key (UUID)
   - Sendet Email mit License Key
7. **User wird redirected** zu Success Page
8. **Success Page zeigt**:
   - License Key
   - Download Button
   - Installationsanleitung

## 🔗 API Endpoints

### Authentication
```typescript
POST /api/auth/register
Body: { email, password, name? }
Response: { message, user }

POST /api/auth/[...nextauth]
// NextAuth Handlers (login, logout, session)

GET /api/auth/session
Response: { user: { id, email, name, subscription, license } }
```

### Stripe
```typescript
POST /api/stripe/create-checkout-session
Body: { priceId, plan, billingPeriod }
Response: { sessionId }

POST /api/stripe/webhook
// Stripe Webhook Events Handler
Events: checkout.session.completed, customer.subscription.updated, 
        customer.subscription.deleted, invoice.payment_failed
```

### Download
```typescript
GET /api/download/app
Response: { downloadUrl, licenseKey, plan, expiresAt }
// Protected: Requires active license
```

### Email
```typescript
POST /api/send-email
Body: { type, email, name?, licenseKey?, plan? }
Types: "welcome", "license"
```

## 🎨 UI Components

### Navigation
- **Logged Out**: Login Button + Get Started Button
- **Logged In**: User Menu mit Dashboard Link und Logout

### Dashboard
- **Plan Card**: Aktueller Plan, Status, Billing Info
- **License Card**: License Key mit Copy Button
- **Download Card**: Download Button (nur mit aktiver License)

### Success Page
- **License Key Display**: Mit Copy-to-Clipboard
- **Download Button**: Direkter Zugriff
- **Email Confirmation**: Info über gesendete Email

## 🔒 Security Features

### Password Security
- bcrypt Hashing mit Salt
- Minimum 8 Zeichen Validierung
- Server-side Validierung

### Session Security
- JWT-basierte Sessions
- NEXTAUTH_SECRET für Encryption
- HTTP-only Cookies

### API Security
- Protected Routes mit Middleware
- Session Validation in APIs
- Stripe Webhook Signature Verification

### License Validation
- Status Check (active/revoked/expired)
- Expiration Date Validation
- User Ownership Verification

## 📧 Email Templates

### Welcome Email
```
Subject: Willkommen bei AutoLabel!
Content: Begrüßung + Info über Free Plan
```

### License Email
```
Subject: Ihr AutoLabel License Key
Content: 
- License Key (groß angezeigt)
- Plan Info
- Download Link
- Installationsanleitung
```

### Payment Failed Email
```
Subject: Zahlungsproblem bei AutoLabel
Content: Info über fehlgeschlagene Zahlung + Handlungsaufforderung
```

## 🚀 Quick Start

### 1. Installation
```bash
cd website
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
# Fülle alle erforderlichen Werte aus
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Development
```bash
npm run dev
```

### 5. Stripe Webhook (Lokal)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🧪 Testing

### Test User Registration
1. Gehe zu `/register`
2. Registriere mit Test-Email
3. Login mit `/login`

### Test Payment Flow
1. Gehe zu `/#pricing`
2. Klicke auf "Start Plus" oder "Start Pro"
3. Verwende Stripe Test Card: `4242 4242 4242 4242`
4. Prüfe Success Page und Dashboard

### Test License Download
1. Nach erfolgreichem Payment
2. Gehe zu `/dashboard`
3. Klicke auf "Jetzt herunterladen"
4. Prüfe `/download` Page

## 📝 Environment Variables

### Erforderlich
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_ID_PLUS_MONTHLY="price_..."
STRIPE_PRICE_ID_PLUS_YEARLY="price_..."
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@autolabel.com"

# App
APP_DOWNLOAD_URL="https://github.com/.../AutoLabel-Setup.exe"
```

## 🐛 Troubleshooting

### "Prisma Client not found"
```bash
npx prisma generate
```

### "Stripe webhook signature verification failed"
- Prüfe `STRIPE_WEBHOOK_SECRET`
- Verwende `stripe listen` für lokales Testing

### "Email not sent"
- Prüfe `RESEND_API_KEY`
- Verifiziere Domain in Resend Dashboard

### "Session not found"
- Prüfe `NEXTAUTH_SECRET`
- Prüfe `NEXTAUTH_URL`
- Lösche Browser Cookies

## 📚 Weitere Dokumentation

- **SETUP.md**: Detaillierte Setup-Anleitung
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org/
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs

## 🎯 Production Checklist

- [ ] Environment Variables in Production gesetzt
- [ ] Database auf PostgreSQL migriert
- [ ] Stripe Webhooks auf Production-URL konfiguriert
- [ ] Resend Domain verifiziert
- [ ] SSL/HTTPS aktiviert
- [ ] NEXTAUTH_URL auf Production-Domain gesetzt
- [ ] APP_DOWNLOAD_URL auf Production-Installer gesetzt
- [ ] Stripe Live Mode aktiviert
- [ ] Email Templates getestet
- [ ] Payment Flow getestet
- [ ] Download Flow getestet

## 💡 Best Practices

### Security
- Verwende starke `NEXTAUTH_SECRET`
- Aktiviere Stripe Webhook Signature Verification
- Verwende HTTPS in Production
- Validiere alle User Inputs

### Database
- Verwende PostgreSQL in Production
- Erstelle regelmäßige Backups
- Überwache Database Performance

### Emails
- Verifiziere Domain in Resend
- Teste alle Email Templates
- Überwache Email Delivery

### Monitoring
- Überwache Stripe Webhooks
- Logge wichtige Events
- Setze Error Tracking auf (z.B. Sentry)

## 🤝 Support

Bei Fragen oder Problemen:
1. Prüfe SETUP.md
2. Prüfe Logs in Console
3. Prüfe Stripe Dashboard
4. Prüfe Resend Dashboard
5. Öffne Issue im Repository

---

**Status**: ✅ Vollständig implementiert und einsatzbereit

**Version**: 1.0.0

**Letzte Aktualisierung**: Dezember 2025

