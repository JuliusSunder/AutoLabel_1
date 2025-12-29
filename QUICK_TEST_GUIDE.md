# Quick Test Guide - Payment + Download

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: Stripe CLI Webhook starten

Öffne ein **neues Terminal** (PowerShell) und führe aus:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**WICHTIG:** 
- Dieses Terminal muss **die ganze Zeit laufen** während du testest
- Du siehst dann Output wie:
  ```
  > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
  ```

**Kopiere den `whsec_...` Secret!**

### Schritt 2: Webhook Secret zu .env.local hinzufügen

Öffne oder erstelle `website/.env.local`:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dein-geheimer-schlüssel-hier"

# Stripe Test Keys (aus Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"  # <-- VON STRIPE CLI KOPIEREN!

# Stripe Price IDs (aus Stripe Dashboard → Products)
STRIPE_PRICE_ID_PLUS_MONTHLY="price_..."
STRIPE_PRICE_ID_PLUS_YEARLY="price_..."
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."

# Download URL (für Testing)
APP_DOWNLOAD_URL="http://localhost:3000/downloads/AutoLabel-Setup.exe"
WEBSITE_URL="http://localhost:3000"
```

**WICHTIG:** 
- Füge `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` hinzu (für Frontend):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Schritt 3: Stripe Price IDs erstellen (falls noch nicht geschehen)

1. **Gehe zu:** https://dashboard.stripe.com/test/products
2. **Klicke auf "Add product"**
3. **Erstelle 4 Products:**

   **Plus Monthly:**
   - Name: `Plus Plan - Monthly`
   - Price: `€7.99`
   - Billing period: `Monthly`
   - Copy Price ID (beginnt mit `price_...`)

   **Plus Yearly:**
   - Name: `Plus Plan - Yearly`
   - Price: `€76.68` (€6.39/Monat)
   - Billing period: `Yearly`
   - Copy Price ID

   **Pro Monthly:**
   - Name: `Pro Plan - Monthly`
   - Price: `€18.99`
   - Billing period: `Monthly`
   - Copy Price ID

   **Pro Yearly:**
   - Name: `Pro Plan - Yearly`
   - Price: `€182.28` (€15.19/Monat)
   - Billing period: `Yearly`
   - Copy Price ID

4. **Füge alle Price IDs zu `.env.local` hinzu**

### Schritt 4: Server starten

In einem **anderen Terminal** (neben Stripe CLI):

```powershell
cd website
npm run dev
```

**Warte bis:** `✓ Ready in X.Xs` erscheint

### Schritt 5: User registrieren

1. **Öffne:** http://localhost:3000
2. **Klicke auf "Registrieren"** oder gehe zu `/register`
3. **Fülle aus:**
   - Email: `test@example.com`
   - Name: `Test User`
   - Passwort: `test123456`
4. **Klicke "Registrieren"**
5. **Du wirst automatisch eingeloggt**

### Schritt 6: Payment durchführen

1. **Gehe zur Pricing Page:**
   - Klicke auf "Pricing" in der Navigation
   - Oder: http://localhost:3000/#pricing

2. **Wähle einen Plan:**
   - Klicke auf **"Start Plus"** oder **"Start Pro"**

3. **Stripe Checkout öffnet sich:**
   - Verwende diese **Test-Kreditkarte:**
     ```
     Karten-Nummer: 4242 4242 4242 4242
     Ablaufdatum: 12/25 (oder beliebige zukünftige Daten)
     CVC: 123 (oder beliebige 3 Ziffern)
     Name: Test User
     ```

4. **Klicke "Zahlung abschließen"**

5. **Du wirst zu `/success` weitergeleitet**

### Schritt 7: Webhook prüfen

**Im Stripe CLI Terminal solltest du sehen:**
```
checkout.session.completed [200]
customer.subscription.created [200]
```

**Falls Fehler:**
- Prüfe ob `STRIPE_WEBHOOK_SECRET` korrekt ist
- Prüfe Server-Logs für Fehler

### Schritt 8: Dashboard prüfen

1. **Gehe zum Dashboard:**
   - Klicke auf "Dashboard" in der Navigation
   - Oder: http://localhost:3000/dashboard

2. **Überprüfe:**
   - ✅ **Plan Card:** Zeigt deinen Plan (Plus/Pro)
   - ✅ **License Card:** Zeigt deinen License Key
   - ✅ **Usage Info:** Zeigt Limits (60 Labels für Plus, Unlimited für Pro)
   - ✅ **Download Card:** Zeigt "Jetzt herunterladen" Button

### Schritt 9: Download testen

1. **Klicke auf "Jetzt herunterladen"**
   - Der Download sollte automatisch starten
   - Oder die Datei wird heruntergeladen

2. **Überprüfe Browser DevTools (F12):**
   - Gehe zu Network Tab
   - Klicke auf Download Button
   - Prüfe Request zu `/api/download/app`
   - Response sollte enthalten:
     ```json
     {
       "downloadUrl": "http://localhost:3000/downloads/AutoLabel-Setup.exe",
       "licenseKey": "uuid-string",
       "plan": "plus",
       "expiresAt": "2024-12-31T23:59:59Z"
     }
     ```

## 🔍 Troubleshooting

### Problem: "Stripe failed to load"

**Lösung:**
```env
# Füge zu .env.local hinzu:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```
Server neu starten!

### Problem: "Price ID nicht gefunden"

**Lösung:**
1. Prüfe ob Price IDs in Stripe Dashboard existieren
2. Prüfe ob sie in `.env.local` korrekt gesetzt sind
3. Server neu starten

### Problem: Webhook wird nicht ausgelöst

**Lösung:**
1. Prüfe ob Stripe CLI läuft: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Prüfe ob `STRIPE_WEBHOOK_SECRET` korrekt ist (aus Stripe CLI Output kopiert)
3. Prüfe Server-Logs für Fehler

**Manuell testen:**
```powershell
stripe trigger checkout.session.completed
```

### Problem: License wird nicht erstellt

**Lösung:**
1. **Prisma Studio öffnen:**
   ```powershell
   cd website
   npx prisma studio
   ```

2. **Manuell prüfen:**
   - Gehe zu `Subscription` Tabelle → Prüfe ob Subscription erstellt wurde
   - Gehe zu `License` Tabelle → Prüfe ob License erstellt wurde

3. **Webhook Logs prüfen:**
   - Schaue in Server-Logs
   - Prüfe Stripe CLI Output

### Problem: Download funktioniert nicht

**Lösung:**
1. **Datei bereitstellen:**
   ```powershell
   # Erstelle Platzhalter-Datei
   echo "AutoLabel Setup" > website/public/downloads/AutoLabel-Setup.exe
   ```

2. **Environment Variable prüfen:**
   ```powershell
   cd website
   node -e "console.log(process.env.APP_DOWNLOAD_URL)"
   ```

3. **Server neu starten**

## ✅ Checkliste

- [ ] Stripe CLI läuft (`stripe listen`)
- [ ] Webhook Secret zu `.env.local` hinzugefügt
- [ ] Stripe Test Keys konfiguriert
- [ ] Price IDs erstellt und konfiguriert
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` gesetzt
- [ ] Server läuft (`npm run dev`)
- [ ] User registriert
- [ ] Payment durchgeführt (Test-Kreditkarte)
- [ ] Webhook verarbeitet (siehe Stripe CLI Output)
- [ ] Dashboard zeigt Plan und License
- [ ] Download funktioniert

## 📊 Erwartete Ergebnisse

### Nach erfolgreichem Payment:

**Stripe CLI Output:**
```
checkout.session.completed [200]
customer.subscription.created [200]
```

**Database (Prisma Studio):**
- ✅ `User` Tabelle: Dein User
- ✅ `Subscription` Tabelle: Active Subscription mit Plan
- ✅ `License` Tabelle: Active License mit License Key

**Dashboard:**
- ✅ Plan wird angezeigt (Plus/Pro)
- ✅ License Key wird angezeigt
- ✅ Usage Limits werden angezeigt
- ✅ Download Button ist verfügbar

**Download API:**
- ✅ Gibt `downloadUrl` zurück
- ✅ Gibt `licenseKey` zurück
- ✅ Gibt `plan` zurück

## 🎯 Nächste Schritte nach erfolgreichem Test

1. **Production Setup:**
   - Wechsle zu Production Stripe Keys
   - Konfiguriere Production Webhook in Stripe Dashboard
   - Setze Production URLs

2. **CDN Setup:**
   - Lade echte .exe Datei auf CDN hoch
   - Setze `APP_DOWNLOAD_URL` auf CDN URL

3. **Email Setup:**
   - Konfiguriere Email-Versand für License Keys
   - Teste Email-Versand

4. **Monitoring:**
   - Setze Error Tracking (z.B. Sentry)
   - Setze Analytics (z.B. Google Analytics)

**Viel Erfolg beim Testing!** 🚀

