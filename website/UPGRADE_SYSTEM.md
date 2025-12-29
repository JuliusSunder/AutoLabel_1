# Upgrade-System Implementierung

## ✅ Was wurde implementiert

### 1. Neue Upgrade-Route
**Datei:** `website/app/api/stripe/upgrade-subscription/route.ts`

- Prüft ob bereits eine aktive Subscription existiert
- Aktualisiert die bestehende Stripe Subscription mit neuem Plan
- Stripe berechnet automatisch die Differenz (Proration)
- Aktualisiert lokale Database (Subscription + License)

### 2. Checkout-Session Route angepasst
**Datei:** `website/app/api/stripe/create-checkout-session/route.ts`

- Prüft ob bereits aktive Subscription existiert
- Gibt Fehler zurück wenn Upgrade-Route verwendet werden sollte

### 3. Webhook-Handler angepasst
**Datei:** `website/app/api/stripe/webhook/route.ts`

- `handleSubscriptionUpdated` aktualisiert jetzt auch `plan` und `billingPeriod`
- License wird mit neuem Plan aktualisiert

### 4. Stripe Library erweitert
**Datei:** `website/app/lib/stripe.ts`

- Neue Funktion: `upgradeSubscription()`
- Handles Upgrade-Logik

### 5. Pricing-Komponente angepasst
**Datei:** `website/app/components/sections/Pricing.tsx`

- Prüft ob User bereits einen Plan hat
- Verwendet automatisch Upgrade-Route wenn Subscription existiert
- Zeigt Erfolgsmeldung mit Info über automatische Proration

## 🎯 Funktionsweise

### Upgrade-Flow:

1. **User klickt auf "Start Pro" (hat bereits Plus Plan)**
2. **Frontend prüft:** Hat User bereits aktive Subscription?
3. **Wenn ja:** Ruft `/api/stripe/upgrade-subscription` auf
4. **Backend:**
   - Ruft Stripe Subscription Update API auf
   - Stripe berechnet automatisch Differenz (Proration)
   - Erstellt Invoice für Differenz
   - Aktualisiert lokale Database
5. **Frontend:** Zeigt Erfolgsmeldung + lädt Seite neu

### Proration:

Stripe berechnet automatisch:
- **Beispiel:** Plus Monthly (€7.99) → Pro Monthly (€18.99)
- **Differenz:** €11.00
- **Proration:** Nur für restliche Tage im aktuellen Billing-Zyklus
- **Invoice:** Wird sofort erstellt und abgerechnet

## 📋 Testing Checklist

- [ ] Plus Plan kaufen
- [ ] Auf Pro upgraden → Prüfe ob Plan sich ändert
- [ ] Prüfe ob nur Differenz berechnet wird
- [ ] Prüfe Dashboard zeigt neuen Plan
- [ ] Prüfe License zeigt neuen Plan
- [ ] Prüfe Webhook Events (`customer.subscription.updated`)

## 🔍 Wichtige Hinweise

### Proration-Verhalten:
- `proration_behavior: 'always_invoice'` → Berechnet Differenz sofort
- Alternative: `'create_prorations'` → Erstellt Prorations aber keine Invoice sofort

### Plan-Updates:
- Plan wird sowohl in Subscription als auch in License aktualisiert
- Webhook-Handler aktualisiert Plan bei `subscription.updated` Event

### Fehlerbehandlung:
- Wenn kein aktiver Plan → Normale Checkout-Session
- Wenn gleicher Plan → Fehlermeldung
- Wenn Upgrade fehlschlägt → Fehlermeldung mit Details

## 🚀 Nächste Schritte (Optional)

1. **Downgrade-Funktion:** Von Pro auf Plus downgraden
2. **Billing Period Change:** Von Monthly auf Yearly wechseln
3. **Cancel & Resume:** Subscription pausieren und wieder aktivieren
4. **Usage Limits Update:** Automatisch Limits aktualisieren nach Upgrade

