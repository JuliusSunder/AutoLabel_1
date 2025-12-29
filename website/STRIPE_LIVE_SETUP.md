# Stripe Live Keys Setup - Schritt für Schritt

## 🎯 Ziel
Von Stripe Test Mode auf Live Mode umstellen für Production.

---

## Schritt 1: Stripe Account vorbereiten

### 1.1 Account-Verifizierung prüfen
1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com)
2. Prüfe ob dein Account vollständig verifiziert ist:
   - **Settings → Account → Business details**
   - Alle Pflichtfelder müssen ausgefüllt sein
   - Bankverbindung muss hinzugefügt sein

### 1.2 Live Mode aktivieren
1. Im Stripe Dashboard oben rechts: **Toggle von "Test mode" auf "Live mode"**
2. ⚠️ **WICHTIG:** Du bist jetzt im Live Mode - alle Aktionen sind echt!

---

## Schritt 2: Live API Keys generieren

### 2.1 Secret Key kopieren
1. Gehe zu: **Developers → API keys**
2. Unter **"Secret key"** findest du: `sk_live_...`
3. Klicke auf **"Reveal test key"** oder **"Reveal live key"**
4. **Kopiere den Secret Key** (beginnt mit `sk_live_`)

### 2.2 Publishable Key kopieren
1. Im selben Bereich findest du: **"Publishable key"**
2. **Kopiere den Publishable Key** (beginnt mit `pk_live_`)

### 2.3 Keys sicher speichern
- ⚠️ **NIEMALS** diese Keys in Git committen!
- Speichere sie nur in `.env.local` oder Production Environment Variables

---

## Schritt 3: Live Products & Prices erstellen

### 3.1 Products erstellen (falls noch nicht geschehen)
1. Gehe zu: **Products → Add product**
2. Erstelle für jeden Plan ein Product:

   **Plus Plan:**
   - Name: `Plus Plan`
   - Description: `AutoLabel Plus - 60 Labels pro Monat`
   
   **Pro Plan:**
   - Name: `Pro Plan`
   - Description: `AutoLabel Pro - Unlimited Labels`

### 3.2 Prices erstellen
Für jedes Product erstellst du 2 Prices:

**Plus Monthly:**
- Price: `€7.99`
- Billing period: `Monthly`
- Copy Price ID (beginnt mit `price_...`)

**Plus Yearly:**
- Price: `€76.68` (€6.39/Monat)
- Billing period: `Yearly`
- Copy Price ID

**Pro Monthly:**
- Price: `€18.99`
- Billing period: `Monthly`
- Copy Price ID

**Pro Yearly:**
- Price: `€182.28` (€15.19/Monat)
- Billing period: `Yearly`
- Copy Price ID

---

## Schritt 4: Production Webhook Endpoint erstellen

### 4.1 Webhook Endpoint erstellen
1. Gehe zu: **Developers → Webhooks**
2. Klicke auf **"Add endpoint"**
3. **Endpoint URL:** `https://deine-domain.com/api/stripe/webhook`
   - ⚠️ **WICHTIG:** Muss HTTPS sein (nicht HTTP!)
   - Beispiel: `https://autolabel.app/api/stripe/webhook`
4. **Description:** `AutoLabel Production Webhook`

### 4.2 Events auswählen
Wähle folgende Events aus:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### 4.3 Webhook Secret kopieren
1. Nach dem Erstellen des Endpoints
2. Klicke auf den Endpoint
3. Unter **"Signing secret"** findest du: `whsec_...`
4. **Kopiere den Secret** (beginnt mit `whsec_`)

---

## Schritt 5: Environment Variables aktualisieren

### 5.1 Lokale .env.local aktualisieren (für Testing)

Öffne `website/.env.local` und ersetze die Test-Keys:

```env
# Stripe Live Keys (Production)
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"

# Stripe Live Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_MONTHLY="price_xxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS_YEARLY="price_xxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY="price_xxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY="price_xxxxxxxxxxxxx"
```

### 5.2 Production Environment Variables setzen

**Für Vercel:**
1. Gehe zu Vercel Dashboard → Dein Projekt → Settings → Environment Variables
2. Füge alle Stripe Live Keys hinzu
3. Setze Environment auf **"Production"**

**Für andere Hosting-Plattformen:**
- Railway: Project → Variables
- Render: Environment → Environment Variables
- Netlify: Site settings → Environment variables

---

## Schritt 6: Testing mit Live Keys

### 6.1 ⚠️ WICHTIG: Test mit echten Karten!
- Im Live Mode werden **echte Zahlungen** verarbeitet
- Verwende nur echte Karten für Testing
- Oder teste mit sehr kleinen Beträgen (z.B. €0.50)

### 6.2 Test-Flow
1. Server neu starten (damit neue Environment Variables geladen werden)
2. Gehe zu deiner Website
3. Teste den Payment Flow
4. Prüfe ob Webhook Events ankommen (in Stripe Dashboard → Webhooks → Endpoint → Events)

---

## Schritt 7: Checkliste

- [ ] Stripe Account vollständig verifiziert
- [ ] Live Mode aktiviert
- [ ] Live Secret Key kopiert (`sk_live_...`)
- [ ] Live Publishable Key kopiert (`pk_live_...`)
- [ ] Live Products erstellt
- [ ] Live Prices erstellt (4 Price IDs)
- [ ] Production Webhook Endpoint erstellt
- [ ] Webhook Secret kopiert (`whsec_...`)
- [ ] Environment Variables in `.env.local` aktualisiert
- [ ] Environment Variables in Production (Vercel/etc.) gesetzt
- [ ] Server neu gestartet
- [ ] Payment Flow getestet
- [ ] Webhook Events geprüft

---

## ⚠️ Wichtige Hinweise

### Sicherheit
- **NIEMALS** Live Keys in Git committen
- Verwende immer Environment Variables
- Prüfe `.gitignore` enthält `.env.local`

### Testing
- Im Live Mode werden echte Zahlungen verarbeitet
- Teste mit kleinen Beträgen oder echten Test-Karten
- Stripe hat keine Test-Karten für Live Mode

### Rollback
- Falls Probleme auftreten, kannst du zurück zu Test Mode wechseln
- Test-Keys funktionieren weiterhin im Test Mode

---

## 🆘 Troubleshooting

### "Invalid API Key"
- Prüfe ob du im richtigen Mode bist (Live vs Test)
- Prüfe ob Keys korrekt kopiert wurden (keine Leerzeichen)

### "Webhook signature verification failed"
- Prüfe ob `STRIPE_WEBHOOK_SECRET` korrekt ist
- Prüfe ob Webhook Secret vom richtigen Endpoint stammt

### "Price ID not found"
- Prüfe ob Price IDs im Live Mode erstellt wurden
- Prüfe ob `NEXT_PUBLIC_` Prefix für Price IDs vorhanden ist

---

## 📚 Weitere Ressourcen

- [Stripe Live Mode Guide](https://stripe.com/docs/keys)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

