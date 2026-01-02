# Download API - Auto-Create License Feature

## Übersicht

Die Download API (`/api/download/app`) erstellt automatisch fehlende Lizenzen für Premium-Subscriptions.

## Problem

Wenn eine Subscription manuell über Prisma Studio von "free" auf "plus"/"pro" geändert wird, existiert keine License in der Datenbank. Dies führte zu einem 403 Fehler beim Download.

## Lösung

Die API prüft jetzt, ob eine Premium-Subscription ohne License existiert und erstellt automatisch eine License.

## Implementierung

### Code-Logik

```typescript
// Premium users need a valid license
if (plan !== "free") {
  // Auto-create license if missing
  if (!license) {
    console.log(`[Download API] Premium subscription found without license for user ${user.id}`);
    
    license = await prisma.license.create({
      data: {
        userId: user.id,
        status: "active",
        plan: plan,
        expiresAt: user.subscriptions[0]?.currentPeriodEnd || null,
      },
    });
    
    console.log(`[Download API] ✓ Successfully created license ${license.licenseKey}`);
  }
}
```

### Sicherheitsmerkmale

1. **Try-Catch Block**: Fehler beim Erstellen werden abgefangen
2. **Logging**: Alle Auto-Create-Vorgänge werden geloggt
3. **Fallback**: Bei Fehler wird 403 mit Support-Hinweis zurückgegeben
4. **Expiration**: License übernimmt `currentPeriodEnd` von Subscription

## Wann wird eine License erstellt?

Eine License wird automatisch erstellt wenn:
- ✅ User hat eine **aktive** Subscription (`status: "active"`)
- ✅ Plan ist **nicht** "free" (also "plus" oder "pro")
- ✅ **Keine** aktive License existiert

## Normale Flow (Stripe Checkout)

Bei normalem Stripe-Checkout wird die License bereits im Webhook erstellt:

```typescript
// website/app/api/stripe/webhook/route.ts
async function handleCheckoutSessionCompleted(session) {
  // ... Subscription erstellen ...
  
  // License erstellen
  await prisma.license.create({
    data: {
      userId: user.id,
      status: "active",
      plan: plan,
      expiresAt: subscription.current_period_end,
    },
  });
}
```

## Manuelle Änderungen (Prisma Studio)

Wenn du eine Subscription manuell änderst:

### Option 1: Auto-Create (empfohlen)
1. Ändere `Subscription.plan` auf "plus" oder "pro"
2. Ändere `Subscription.status` auf "active"
3. Rufe `/api/download/app` auf
4. License wird automatisch erstellt ✅

### Option 2: Manuell erstellen
1. Ändere `Subscription.plan` auf "plus" oder "pro"
2. Erstelle manuell einen `License` Eintrag:
   ```typescript
   {
     userId: "user-id",
     status: "active",
     plan: "plus",
     expiresAt: null  // oder Datum
   }
   ```

## Logging

Die API loggt alle Auto-Create-Vorgänge:

```
[Download API] Premium subscription found without license for user abc-123 (plan: plus)
[Download API] Auto-creating license for user abc-123
[Download API] ✓ Successfully created license def-456 for user abc-123
```

Bei Fehlern:
```
[Download API] Failed to create license for user abc-123: [Error Details]
```

## Testing

### Test 1: Auto-Create für neue Premium-Subscription

```sql
-- 1. Subscription erstellen (ohne License)
INSERT INTO "Subscription" (id, "userId", plan, status)
VALUES ('sub-123', 'user-456', 'plus', 'active');

-- 2. Download API aufrufen
GET /api/download/app

-- 3. Prüfen ob License erstellt wurde
SELECT * FROM "License" WHERE "userId" = 'user-456';
```

### Test 2: Kein Auto-Create für Free-Plan

```sql
-- 1. Free Subscription
INSERT INTO "Subscription" (id, "userId", plan, status)
VALUES ('sub-789', 'user-101', 'free', 'active');

-- 2. Download API aufrufen
GET /api/download/app

-- 3. Keine License sollte erstellt werden
SELECT * FROM "License" WHERE "userId" = 'user-101';  -- Leer
```

### Test 3: Kein Auto-Create wenn License existiert

```sql
-- 1. Subscription + License existieren
-- Download API sollte keine neue License erstellen
```

## Fehlerbehandlung

### Fehler beim Erstellen

Wenn `prisma.license.create()` fehlschlägt:
- Error wird geloggt
- 403 Response mit "Keine gültige Lizenz gefunden"
- User wird aufgefordert Support zu kontaktieren

### Mögliche Fehlerursachen

1. **Unique Constraint Violation**: License existiert bereits (sollte nicht passieren)
2. **Foreign Key Constraint**: User existiert nicht (sollte nicht passieren)
3. **Database Connection**: Datenbank nicht erreichbar

## Best Practices

### Für Admins

Wenn du Subscriptions manuell änderst:
1. Nutze die Auto-Create Funktion (einfach Download aufrufen)
2. Oder erstelle License manuell im gleichen Schritt
3. Prüfe Logs nach Auto-Create-Vorgängen

### Für Entwickler

Wenn du neue Premium-Features hinzufügst:
1. Prüfe immer ob License existiert
2. Nutze die gleiche Auto-Create-Logik wenn nötig
3. Logge alle Auto-Create-Vorgänge

## Verwandte Dateien

- **API Route**: `website/app/api/download/app/route.ts`
- **Stripe Webhook**: `website/app/api/stripe/webhook/route.ts`
- **Prisma Schema**: `website/prisma/schema.prisma`

## Changelog

### 2025-01-01
- ✅ Auto-Create License Feature implementiert
- ✅ Logging hinzugefügt
- ✅ Error Handling verbessert
- ✅ Dokumentation erstellt

---

**Letzte Aktualisierung:** 2025-01-01

