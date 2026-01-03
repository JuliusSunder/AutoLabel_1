# Subscription & Customer Portal Testing Guide

Diese Anleitung zeigt, wie du die Subscription-Verwaltung und das Stripe Customer Portal **ohne echtes Geld** testen kannst.

## 🔑 Voraussetzungen

1. **Stripe Test Mode aktiviert**
   - Deine `.env.local` sollte Test-Keys verwenden: `STRIPE_SECRET_KEY=sk_test_...`
   - Im Stripe Dashboard sollte "Test Mode" aktiviert sein (oben links)

2. **Customer Portal konfiguriert**
   - Stripe Dashboard → Settings → Customer Portal
   - Link: https://dashboard.stripe.com/settings/billing/portal
   - Aktiviere: Cancel subscriptions, Update payment methods, View invoices

3. **Website läuft lokal**
   ```bash
   cd website
   npm run dev
   ```

## 🧪 Methode 1: Mit Stripe Test-Kreditkarten (Empfohlen)

### Schritt 1: Test-User registrieren

```
http://localhost:3000/register
```

Registriere einen neuen User mit beliebiger Email (z.B. `test@example.com`).

### Schritt 2: Test-Subscription kaufen

1. Gehe zur Pricing-Page: `http://localhost:3000/#pricing`
2. Wähle einen Plan (Plus oder Pro)
3. Im Stripe Checkout verwende eine **Test-Kreditkarte**:

**Erfolgreiche Test-Kreditkarten:**
- Karte: `4242 4242 4242 4242`
- CVV: `123` (beliebig)
- Ablaufdatum: `12/34` (beliebig in der Zukunft)
- PLZ: `12345` (beliebig)

**Weitere Test-Karten:**
- Declined: `4000 0000 0000 0002`
- Requires Authentication: `4000 0025 0000 3155`
- Alle Test-Karten: https://stripe.com/docs/testing#cards

### Schritt 3: Customer Portal testen

1. Nach erfolgreicher Zahlung: Dashboard öffnen (`http://localhost:3000/dashboard`)
2. Du solltest als Plus/Pro-User angezeigt werden
3. Klicke auf **"Manage Subscription"**
4. Du wirst zum Stripe Customer Portal weitergeleitet

**Im Customer Portal kannst du:**
- ✅ Subscription canceln (sofort oder am Ende der Periode)
- ✅ Zahlungsmethode ändern
- ✅ Rechnungen herunterladen
- ✅ Subscription-Details einsehen

### Schritt 4: Cancellation testen

1. Im Customer Portal: "Cancel plan" klicken
2. Wähle "Cancel at period end" oder "Cancel immediately"
3. Bestätige die Cancellation
4. Zurück zum Dashboard → "Update Subscription" klicken
5. Der Status sollte aktualisiert werden

## 🚀 Methode 2: Direkte Test-Subscription (Schneller)

Falls du nicht durch den kompletten Checkout-Flow gehen möchtest:

### Schritt 1: Test-User registrieren

```
http://localhost:3000/register
```

### Schritt 2: Test-Subscription erstellen

```bash
cd website
npx tsx scripts/create-test-subscription.ts test@example.com plus
```

**Parameter:**
- `test@example.com` = Email des registrierten Users
- `plus` oder `pro` = Plan

Das Script:
1. Findet den User in der Datenbank
2. Erstellt einen Stripe Test-Customer
3. Erstellt eine Stripe Test-Subscription
4. Erstellt die Subscription in der Datenbank
5. Generiert einen License Key

### Schritt 3: Customer Portal testen

1. Login mit dem Test-User
2. Dashboard öffnen
3. "Manage Subscription" klicken
4. Im Customer Portal testen

## 🔍 Troubleshooting

### "Manage Subscription" Button nicht sichtbar

**Ursache:** User hat keine aktive Premium-Subscription

**Lösung:**
1. Prüfe im Dashboard, ob der Plan "Plus" oder "Pro" ist (nicht "Free")
2. Falls "Free": Klicke auf "Update Subscription" zum Synchronisieren
3. Falls immer noch "Free": Prüfe die Datenbank mit Prisma Studio:
   ```bash
   cd website
   npx prisma studio
   ```

### "Keine aktive Subscription gefunden" beim Klick auf "Manage Subscription"

**Ursache:** Subscription hat keine `stripeCustomerId`

**Lösung:**
1. Prüfe die Subscription in Prisma Studio
2. Stelle sicher, dass `stripeCustomerId` gesetzt ist
3. Falls nicht: Lösche die Subscription und erstelle sie neu mit dem Script

### Customer Portal zeigt "Invalid link"

**Ursache:** Du verwendest Production-Link im Test-Mode (oder umgekehrt)

**Lösung:**
- Test-Mode: Link beginnt mit `https://billing.stripe.com/p/login/test_...`
- Production: Link beginnt mit `https://billing.stripe.com/p/login/...`
- Stelle sicher, dass du im richtigen Mode bist

### Webhook funktioniert nicht nach Cancellation

**Ursache:** Webhooks funktionieren nur mit öffentlicher URL (nicht localhost)

**Lösung für lokales Testing:**
1. Verwende Stripe CLI für lokale Webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Oder teste die Cancellation manuell:
   - Im Stripe Dashboard → Subscriptions
   - Finde die Test-Subscription und cancle sie manuell
   - Klicke im Dashboard auf "Update Subscription"

## 📊 Test-Szenarien

### Szenario 1: Subscription am Ende der Periode canceln

1. Erstelle Test-Subscription
2. Öffne Customer Portal
3. Cancel → "At period end"
4. Zurück zum Dashboard → "Update Subscription"
5. Status sollte zeigen: "Renews on: [Datum]" mit Hinweis auf Cancellation

### Szenario 2: Subscription sofort canceln

1. Erstelle Test-Subscription
2. Öffne Customer Portal
3. Cancel → "Cancel immediately"
4. Zurück zum Dashboard → "Update Subscription"
5. Plan sollte auf "Free" zurückfallen

### Szenario 3: Zahlungsmethode ändern

1. Erstelle Test-Subscription
2. Öffne Customer Portal
3. "Update payment method"
4. Neue Test-Kreditkarte hinzufügen
5. Alte Karte entfernen

### Szenario 4: Rechnungen ansehen

1. Erstelle Test-Subscription
2. Öffne Customer Portal
3. "Invoices" Tab
4. Rechnung herunterladen (PDF)

## 🔗 Nützliche Links

- **Stripe Test-Karten:** https://stripe.com/docs/testing#cards
- **Customer Portal Settings:** https://dashboard.stripe.com/settings/billing/portal
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhook Testing:** https://stripe.com/docs/webhooks/test

## 🎯 Wichtige Hinweise

1. **Niemals Production-Keys für Tests verwenden!**
2. Test-Subscriptions werden automatisch nach 90 Tagen gelöscht
3. Test-Zahlungen erscheinen nicht in echten Rechnungen
4. Customer Portal Link ist unterschiedlich für Test/Production
5. Webhooks funktionieren lokal nur mit Stripe CLI

## 📝 Checkliste für Production

Vor dem Go-Live:

- [ ] Production Stripe Keys in `.env.local` setzen
- [ ] Customer Portal für Production konfiguriert
- [ ] Webhook Endpoint in Production registriert
- [ ] Webhook Secret in `.env.local` gesetzt
- [ ] Production Price IDs in `.env.local` gesetzt
- [ ] Email-Service (Resend) konfiguriert
- [ ] Test-Subscriptions aus Datenbank gelöscht
- [ ] Customer Portal Link getestet

