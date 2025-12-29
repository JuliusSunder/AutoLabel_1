# Payment + Download Test Guide

## 🎯 Übersicht

Dieser Guide zeigt dir, wie du den kompletten Payment- und Download-Flow testest:
1. User registrieren
2. Payment durchführen (Stripe Test-Modus)
3. License Key erhalten
4. App herunterladen

## 📋 Voraussetzungen

### 1. Stripe Test-Keys konfigurieren

Stelle sicher, dass deine `.env.local` Datei die Stripe Test-Keys enthält:

```env
# Stripe Test Keys (aus Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (aus Stripe Dashboard → Products)
STRIPE_PRICE_ID_PLUS_MONTHLY="price_..."
STRIPE_PRICE_ID_PLUS_YEARLY="price_..."
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dein-geheimer-schlüssel"

# Download URL (für Testing)
APP_DOWNLOAD_URL="http://localhost:3000/downloads/AutoLabel-Setup.exe"
WEBSITE_URL="http://localhost:3000"
```

### 2. Stripe Price IDs erstellen

Falls du noch keine Price IDs hast:

1. **Gehe zu Stripe Dashboard:** https://dashboard.stripe.com/test/products
2. **Erstelle Products:**
   - **Plus Plan** (Monthly): €7.99/Monat
   - **Plus Plan** (Yearly): €76.68/Jahr (€6.39/Monat)
   - **Pro Plan** (Monthly): €18.99/Monat
   - **Pro Plan** (Yearly): €182.28/Jahr (€15.19/Monat)
3. **Kopiere die Price IDs** (beginnen mit `price_...`)
4. **Füge sie zu `.env.local` hinzu**

### 3. Stripe Webhook konfigurieren (für lokales Testing)

Für lokales Testing musst du Stripe CLI verwenden:

**Installation:**
```bash
# Windows (mit Scoop)
scoop install stripe

# Oder Download von: https://stripe.com/docs/stripe-cli
```

**Webhook lokal weiterleiten:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**WICHTIG:** Kopiere den `whsec_...` Secret und füge es zu `.env.local` hinzu!

### 4. Download-Datei bereitstellen (optional)

Für lokales Testing kannst du eine Platzhalter-Datei erstellen:

```bash
# Erstelle einen leeren Platzhalter
echo "AutoLabel Setup" > website/public/downloads/AutoLabel-Setup.exe
```

**Oder** verwende eine externe URL für Testing.

## 🧪 Test-Ablauf

### Schritt 1: Server starten

```bash
cd website
npm run dev
```

**WICHTIG:** Stelle sicher, dass der Stripe Webhook läuft:
```bash
# In einem separaten Terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Schritt 2: User registrieren

1. **Öffne:** http://localhost:3000
2. **Klicke auf "Registrieren"** oder gehe zu `/register`
3. **Fülle das Formular aus:**
   - Email: `test@example.com`
   - Name: `Test User`
   - Passwort: `test123456`
4. **Klicke auf "Registrieren"**
5. **Du wirst automatisch eingeloggt**

### Schritt 3: Payment durchführen

1. **Gehe zur Pricing Page:**
   - Klicke auf "Pricing" in der Navigation
   - Oder gehe zu: http://localhost:3000/#pricing

2. **Wähle einen Plan:**
   - **Plus Plan** (€7.99/Monat) oder
   - **Pro Plan** (€18.99/Monat)

3. **Klicke auf "Start Plus" oder "Start Pro"**
   - Du wirst zu Stripe Checkout weitergeleitet

4. **Stripe Test-Kreditkarte verwenden:**
   ```
   Karten-Nummer: 4242 4242 4242 4242
   Ablaufdatum: Beliebige zukünftige Daten (z.B. 12/25)
   CVC: Beliebige 3 Ziffern (z.B. 123)
   Name: Beliebiger Name
   ```

5. **Klicke auf "Zahlung abschließen"**
   - Du wirst zu `/success` weitergeleitet

### Schritt 4: Webhook verarbeiten

**Automatisch:**
- Der Stripe Webhook sollte automatisch ausgelöst werden
- Die Subscription wird in der Datenbank erstellt
- Ein License Key wird generiert

**Manuell prüfen:**
```bash
# In der Stripe CLI siehst du die Events:
# checkout.session.completed
# customer.subscription.created
```

**Falls Webhook nicht funktioniert:**
- Prüfe ob `stripe listen` läuft
- Prüfe ob `STRIPE_WEBHOOK_SECRET` korrekt ist
- Schaue in die Server-Logs

### Schritt 5: Dashboard prüfen

1. **Gehe zum Dashboard:**
   - Klicke auf "Dashboard" in der Navigation
   - Oder gehe zu: http://localhost:3000/dashboard

2. **Überprüfe:**
   - ✅ **Plan Card:** Zeigt deinen Plan (Plus/Pro)
   - ✅ **License Card:** Zeigt deinen License Key
   - ✅ **Usage Info:** Zeigt deine Limits
   - ✅ **Download Card:** Zeigt "Jetzt herunterladen" Button

### Schritt 6: Download testen

1. **Klicke auf "Jetzt herunterladen"**
   - Der Download sollte automatisch starten
   - Oder die Datei wird heruntergeladen

2. **Überprüfe die Download-URL:**
   - Öffne Browser DevTools (F12)
   - Gehe zu Network Tab
   - Klicke auf Download Button
   - Prüfe die Request zu `/api/download/app`

3. **Erwartete Response:**
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
- Überprüfe ob `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local` gesetzt ist
- Server neu starten
- Browser-Cache leeren

### Problem: "Price ID nicht gefunden"

**Lösung:**
- Überprüfe ob Price IDs in Stripe Dashboard existieren
- Überprüfe ob sie in `.env.local` korrekt gesetzt sind
- Server neu starten

### Problem: Webhook wird nicht ausgelöst

**Lösung:**
1. **Stripe CLI prüfen:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Webhook Secret prüfen:**
   - Kopiere den `whsec_...` aus Stripe CLI Output
   - Füge zu `.env.local` hinzu als `STRIPE_WEBHOOK_SECRET`

3. **Manuell testen:**
   ```bash
   stripe trigger checkout.session.completed
   ```

### Problem: License wird nicht erstellt

**Lösung:**
1. **Prisma Studio öffnen:**
   ```bash
   cd website
   npx prisma studio
   ```

2. **Manuell prüfen:**
   - Gehe zu `Subscription` Tabelle
   - Prüfe ob Subscription erstellt wurde
   - Gehe zu `License` Tabelle
   - Prüfe ob License erstellt wurde

3. **Webhook Logs prüfen:**
   - Schaue in die Server-Logs
   - Prüfe Stripe CLI Output

### Problem: Download funktioniert nicht

**Lösung:**
1. **Environment Variable prüfen:**
   ```bash
   # In website Ordner
   node -e "console.log(process.env.APP_DOWNLOAD_URL)"
   ```

2. **Datei prüfen:**
   - Stelle sicher, dass Datei unter URL erreichbar ist
   - Teste URL direkt im Browser: http://localhost:3000/downloads/AutoLabel-Setup.exe

3. **Server neu starten:**
   ```bash
   # Server stoppen (Ctrl+C)
   npm run dev
   ```

## 📊 Erwartete Ergebnisse

### Nach erfolgreichem Payment:

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

## 🎯 Test-Szenarien

### Szenario 1: Free Plan User

1. Registriere dich ohne Payment
2. Gehe zum Dashboard
3. **Erwartung:**
   - Plan: "free"
   - Keine License Card
   - Download Button verfügbar
   - Usage: 10 Labels/Monat

### Szenario 2: Plus Plan User

1. Registriere dich
2. Bezahle Plus Plan
3. Gehe zum Dashboard
4. **Erwartung:**
   - Plan: "plus"
   - License Card mit License Key
   - Download Button verfügbar
   - Usage: 60 Labels/Monat
   - Batch Printing: ✓
   - Custom Footer: ✓

### Szenario 3: Pro Plan User

1. Registriere dich
2. Bezahle Pro Plan
3. Gehe zum Dashboard
4. **Erwartung:**
   - Plan: "pro"
   - License Card mit License Key
   - Download Button verfügbar
   - Usage: Unlimited Labels
   - Batch Printing: ✓
   - Custom Footer: ✓

## 🚀 Nächste Schritte

Nach erfolgreichem Testing:

1. **Production Stripe Keys:** Wechsle zu Production Keys
2. **Production Webhook:** Konfiguriere Production Webhook in Stripe Dashboard
3. **CDN Setup:** Lade echte .exe Datei auf CDN hoch
4. **Email Setup:** Konfiguriere Email-Versand für License Keys

## 📝 Checkliste

- [ ] Stripe Test-Keys konfiguriert
- [ ] Stripe Price IDs erstellt und konfiguriert
- [ ] Stripe Webhook lokal eingerichtet
- [ ] Download-Datei bereitgestellt (oder externe URL)
- [ ] Server läuft
- [ ] Stripe CLI läuft (`stripe listen`)
- [ ] User registriert
- [ ] Payment durchgeführt (Test-Kreditkarte)
- [ ] Webhook verarbeitet
- [ ] Dashboard zeigt Plan und License
- [ ] Download funktioniert

**Viel Erfolg beim Testing!** 🎉

