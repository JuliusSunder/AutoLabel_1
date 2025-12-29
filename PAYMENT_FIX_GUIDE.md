# Payment Fix Guide - "Start Plus" führt zu Dashboard

## Problem behoben ✅

Ich habe die Pricing-Komponente angepasst:
1. ✅ Prüft jetzt ob User eingeloggt ist
2. ✅ Leitet zum Login weiter wenn nicht eingeloggt
3. ✅ Bessere Error-Behandlung
4. ✅ Loading-State während Checkout

## Was du jetzt tun musst:

### 1. Environment Variables prüfen

Stelle sicher, dass in `website/.env.local` folgende Variablen gesetzt sind:

```env
# Stripe Keys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # <-- WICHTIG für Frontend!

# Stripe Price IDs (MÜSSEN gesetzt sein!)
NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY="price_..."
NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_YEARLY="price_..."
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY="price_..."

# Stripe Webhook
STRIPE_WEBHOOK_SECRET="whsec_..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dein-geheimer-schlüssel"

# Download
APP_DOWNLOAD_URL="http://localhost:3000/downloads/AutoLabel-Setup.exe"
WEBSITE_URL="http://localhost:3000"
```

**WICHTIG:** 
- Alle `NEXT_PUBLIC_*` Variablen müssen gesetzt sein!
- Server **neu starten** nach Änderungen!

### 2. Price IDs erstellen (falls noch nicht geschehen)

1. **Gehe zu:** https://dashboard.stripe.com/test/products
2. **Erstelle 4 Products:**

   **Plus Monthly:**
   - Name: `Plus Plan - Monthly`
   - Price: `€7.99`
   - Billing period: `Monthly`
   - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY`

   **Plus Yearly:**
   - Name: `Plus Plan - Yearly`
   - Price: `€76.68` (€6.39/Monat)
   - Billing period: `Yearly`
   - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_YEARLY`

   **Pro Monthly:**
   - Name: `Pro Plan - Monthly`
   - Price: `€18.99`
   - Billing period: `Monthly`
   - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY`

   **Pro Yearly:**
   - Name: `Pro Plan - Yearly`
   - Price: `€182.28` (€15.19/Monat)
   - Billing period: `Yearly`
   - Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY`

### 3. Server neu starten

```powershell
# Server stoppen (Ctrl+C)
cd website
npm run dev
```

**WICHTIG:** Nach Änderungen an `.env.local` muss der Server neu gestartet werden!

### 4. Testen

1. **Öffne:** http://localhost:3000
2. **NICHT eingeloggt:**
   - Klicke auf "Start Plus"
   - Sollte zum Login weiterleiten
   - Nach Login zurück zur Pricing Page

3. **Eingeloggt:**
   - Klicke auf "Start Plus"
   - Sollte zu Stripe Checkout weiterleiten
   - Verwende Test-Kreditkarte: `4242 4242 4242 4242`

## Troubleshooting

### Problem: "Start Plus" führt immer noch zu Dashboard

**Lösung:**
1. **Prüfe Browser-Konsole (F12):**
   - Schaue nach Fehlermeldungen
   - Prüfe ob Price IDs `undefined` sind

2. **Prüfe Environment Variables:**
   ```powershell
   cd website
   node -e "console.log('Plus Monthly:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY)"
   ```
   
   Falls `undefined`: Environment Variables nicht gesetzt oder Server nicht neu gestartet!

3. **Prüfe ob User eingeloggt ist:**
   - Gehe zu Dashboard
   - Wenn du eingeloggt bist, sollte es funktionieren
   - Wenn nicht, wirst du zum Login weitergeleitet

### Problem: "Price ID nicht gefunden"

**Lösung:**
- Stelle sicher, dass alle `NEXT_PUBLIC_STRIPE_PRICE_ID_*` Variablen in `.env.local` gesetzt sind
- Server neu starten
- Browser-Cache leeren (Ctrl+Shift+R)

### Problem: "Stripe failed to load"

**Lösung:**
- Stelle sicher, dass `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` gesetzt ist
- Server neu starten

### Problem: "Nicht authentifiziert"

**Lösung:**
- Das ist jetzt korrekt! Du wirst automatisch zum Login weitergeleitet
- Nach dem Login kannst du erneut auf "Start Plus" klicken

## Was wurde geändert?

### `website/app/components/sections/Pricing.tsx`
- ✅ Prüft ob User eingeloggt ist (`useEffect` + `/api/auth/session`)
- ✅ Leitet zum Login weiter wenn nicht eingeloggt
- ✅ Loading-State während Checkout
- ✅ Bessere Error-Behandlung

### `website/app/lib/stripe.ts`
- ✅ Bessere Error-Messages
- ✅ Automatische Weiterleitung zum Login bei 401-Fehler
- ✅ Spezifische Fehlermeldungen für verschiedene Fehler

## Erwartetes Verhalten

### Nicht eingeloggt:
1. Klick auf "Start Plus" → Weiterleitung zu `/login?callbackUrl=/#pricing`
2. Nach Login → Zurück zur Pricing Page
3. Klick auf "Start Plus" → Weiterleitung zu Stripe Checkout

### Eingeloggt:
1. Klick auf "Start Plus" → Direkt zu Stripe Checkout
2. Payment durchführen → Weiterleitung zu `/success`
3. Webhook verarbeitet → Dashboard zeigt Plan und License

## Nächste Schritte

1. ✅ Environment Variables setzen
2. ✅ Price IDs erstellen
3. ✅ Server neu starten
4. ✅ Testen

**Jetzt sollte es funktionieren!** 🚀

