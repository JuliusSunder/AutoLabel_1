# Multi-Account Support Fix - AutoLabel

## ✅ Problem behoben

**Fehler:** "Dieses Gerät ist bereits mit einem anderen Account registriert"

**Ursache:** Das System erlaubte nur einen Account pro Gerät.

**Lösung:** Mehrere Accounts können jetzt dasselbe Gerät verwenden, mit intelligentem Usage-Tracking.

---

## 🎯 Neue Funktionsweise

### 1. **FREE PLAN (10 Labels/Monat)**
- ✅ **Gerätebezogen:** Alle Free-Accounts auf einem Gerät teilen sich 10 Labels
- ✅ **Resettet monatlich**
- ✅ Beispiel: 
  - Account A (Free) nutzt 5 Labels
  - Account B (Free) auf demselben Gerät kann nur noch 5 Labels nutzen
  - Nächsten Monat: Beide haben wieder zusammen 10 Labels

### 2. **PLUS PLAN (60 Labels/Monat)**
- ✅ **Accountbezogen:** Jeder Plus-Account hat seine eigenen 60 Labels
- ✅ **Resettet monatlich**
- ✅ Beispiel:
  - Account A (Plus) hat 60 Labels
  - Account B (Plus) auf demselben Gerät hat auch 60 Labels
  - Beide können unabhängig voneinander ihre 60 Labels nutzen

### 3. **PRO PLAN (Unlimited)**
- ✅ **Accountbezogen:** Nur der Account mit Pro Plan hat unlimited
- ✅ **Keine Limits**
- ✅ Beispiel:
  - Account A (Pro) hat unlimited Labels
  - Account B (Free) auf demselben Gerät hat nur die 10 kostenlosen (geteilt mit anderen Free-Accounts)

---

## 🔧 Technische Änderungen

### 1. **Prisma Schema** (`website/prisma/schema.prisma`)

**Vorher:**
```prisma
model Device {
  deviceId String @unique  // Problem: Nur ein User pro Device
}
```

**Nachher:**
```prisma
model Device {
  deviceId String  // Nicht mehr unique
  
  @@unique([userId, deviceId])  // Unique Kombination
}
```

### 2. **Device-Registrierung** (`website/app/lib/auth-middleware.ts`)

**Vorher:**
- Prüfte ob `deviceId` bereits existiert
- Blockierte Login wenn Device einem anderen User gehört

**Nachher:**
- Prüft ob `userId + deviceId` Kombination existiert
- Erlaubt mehrere User pro Device
- Jeder User kann bis zu 3 Devices haben

### 3. **Usage-Tracking** (`website/app/api/auth/app/validate-label-creation/route.ts`)

**Vorher:**
- Alle Plans: Usage pro `userId + deviceId`

**Nachher:**
- **Free Plan:** Aggregiert Usage über alle Free-Accounts auf dem Device
- **Plus Plan:** Usage nur für den spezifischen Account
- **Pro Plan:** Unlimited, aber Usage wird trotzdem getrackt

---

## 📊 Usage-Tracking Beispiele

### Beispiel 1: Zwei Free Accounts auf einem Gerät

```
Device ID: abc-123
├─ Account A (Free)
│  └─ 3 Labels verwendet
├─ Account B (Free)
│  └─ 5 Labels verwendet
└─ Gesamt: 8/10 Labels (gerätebezogen)
```

Beide Accounts sehen: "2 Labels verbleibend"

### Beispiel 2: Free + Plus Account auf einem Gerät

```
Device ID: abc-123
├─ Account A (Free)
│  └─ 5 Labels verwendet (von 10 gerätebezogen)
├─ Account B (Plus)
│  └─ 20 Labels verwendet (von 60 accountbezogen)
```

- Account A: 5 Labels verbleibend (geteilt mit anderen Free-Accounts)
- Account B: 40 Labels verbleibend (nur für diesen Account)

### Beispiel 3: Zwei Plus Accounts auf einem Gerät

```
Device ID: abc-123
├─ Account A (Plus)
│  └─ 30 Labels verwendet (von 60)
├─ Account B (Plus)
│  └─ 45 Labels verwendet (von 60)
```

- Account A: 30 Labels verbleibend
- Account B: 15 Labels verbleibend
- Beide unabhängig voneinander

### Beispiel 4: Free + Pro Account auf einem Gerät

```
Device ID: abc-123
├─ Account A (Free)
│  └─ 8 Labels verwendet (von 10 gerätebezogen)
├─ Account B (Pro)
│  └─ 250 Labels verwendet (unlimited)
```

- Account A: 2 Labels verbleibend
- Account B: Unlimited

---

## 🚀 Deployment

### 1. **Datenbank-Migration**

Die Änderung am `Device` Model erfordert eine Migration:

```bash
cd website
npx prisma migrate dev --name allow_multiple_accounts_per_device
```

**WICHTIG:** Diese Migration wird:
- ✅ `@unique` Constraint von `deviceId` entfernen
- ✅ Neuen `@@unique([userId, deviceId])` Constraint hinzufügen
- ⚠️ **Bestehende Daten bleiben erhalten**

### 2. **Production Migration**

```bash
# Backup erstellen
pg_dump $DATABASE_URL > backup_before_migration.sql

# Migration ausführen
npx prisma migrate deploy

# Verifizieren
npx prisma db pull
```

### 3. **Rollback (falls nötig)**

Falls Probleme auftreten:

```bash
# Backup wiederherstellen
psql $DATABASE_URL < backup_before_migration.sql

# Oder: Vorherige Migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 🧪 Testing

### Test 1: Mehrere Free Accounts auf einem Gerät

1. Erstelle Account A (Free)
2. Login auf Device 1 → Nutze 5 Labels
3. Logout
4. Erstelle Account B (Free)
5. Login auf Device 1 → Sollte nur noch 5 Labels haben
6. Versuche 6 Labels zu erstellen → Sollte Fehler geben

**Erwartetes Ergebnis:** ✅ Gerätebezogenes Limit funktioniert

### Test 2: Free + Plus Account auf einem Gerät

1. Account A (Free) auf Device 1 → Nutze 8 Labels
2. Logout
3. Account B (Plus) auf Device 1 → Sollte 60 Labels haben
4. Nutze 30 Labels
5. Logout und zurück zu Account A
6. Account A sollte nur noch 2 Labels haben (10 - 8)

**Erwartetes Ergebnis:** ✅ Plus Plan unabhängig von Free Plan

### Test 3: Zwei Plus Accounts auf einem Gerät

1. Account A (Plus) auf Device 1 → Nutze 40 Labels
2. Logout
3. Account B (Plus) auf Device 1 → Sollte 60 Labels haben (nicht 20!)
4. Nutze 50 Labels
5. Beide Accounts haben ihre eigenen Limits

**Erwartetes Ergebnis:** ✅ Jeder Plus Account hat eigene 60 Labels

### Test 4: Account-Wechsel

1. Login mit Account A
2. Logout
3. Login mit Account B
4. Logout
5. Login mit Account A wieder

**Erwartetes Ergebnis:** ✅ Kein "Gerät bereits registriert" Fehler

---

## 📝 Code-Änderungen im Detail

### Datei 1: `website/prisma/schema.prisma`

```diff
model Device {
  id           String   @id @default(uuid())
  userId       String
- deviceId     String   @unique  // UUID von App
+ deviceId     String   // UUID von App - NOT unique anymore
  deviceName   String?
  registeredAt DateTime @default(now())
  lastSeen     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

+ @@unique([userId, deviceId])  // Unique combination
  @@index([userId])
  @@index([deviceId])
}
```

### Datei 2: `website/app/lib/auth-middleware.ts`

**Funktion:** `registerDevice()`

```diff
- // Device exists - check if it belongs to this user
- if (existingDevice.userId !== userId) {
-   return {
-     success: false,
-     error: 'Dieses Gerät ist bereits mit einem anderen Account registriert',
-   };
- }

+ // Check if this user already has this device registered
+ const existingUserDevice = await prisma.device.findFirst({
+   where: {
+     userId,
+     deviceId,
+   },
+ });
```

### Datei 3: `website/app/api/auth/app/validate-label-creation/route.ts`

**Free Plan - Gerätebezogen:**

```typescript
if (plan === 'free') {
  // Get total usage for this device across ALL free plan users
  const deviceUsage = await prisma.usage.aggregate({
    where: {
      deviceId: payload.deviceId,
      month: currentMonth,
      plan: 'free',
    },
    _sum: {
      labelsUsed: true,
    },
  });
  
  const currentUsage = deviceUsage._sum.labelsUsed || 0;
  // ...
}
```

**Plus Plan - Accountbezogen:**

```typescript
if (plan === 'plus') {
  // Get usage for THIS user only
  const usage = await prisma.usage.findUnique({
    where: {
      userId_deviceId_month: {
        userId: user.id,
        deviceId: payload.deviceId,
        month: currentMonth,
      },
    },
  });
  // ...
}
```

---

## ⚠️ Wichtige Hinweise

### 1. **Bestehende Devices**
- Alle bestehenden Device-Registrierungen bleiben erhalten
- User können sich weiterhin auf ihren bisherigen Devices anmelden
- Neue Accounts können jetzt dieselben Devices nutzen

### 2. **Free Plan Sharing**
- Wenn mehrere Free-Accounts auf einem Gerät sind, teilen sie sich die 10 Labels
- Dies ist gewollt und verhindert Missbrauch
- Upgrade zu Plus gibt jedem Account eigene 60 Labels

### 3. **Device Limit**
- Jeder User kann weiterhin max. 3 Devices registrieren
- Ein Device kann von beliebig vielen Usern genutzt werden
- Beispiel: Ein Familien-PC kann von 5 verschiedenen Accounts genutzt werden

### 4. **Usage Reset**
- Usage resettet am 1. des Monats
- Free Plan: Gerätebezogenes Reset
- Plus/Pro: Accountbezogenes Reset

---

## 🎯 Vorteile

1. ✅ **Flexibilität:** Mehrere Accounts auf einem Gerät möglich
2. ✅ **Fair Use:** Free Plan verhindert Missbrauch durch gerätebezogenes Limit
3. ✅ **Monetarisierung:** Plus Plan bietet echten Mehrwert (eigene 60 Labels)
4. ✅ **Skalierbarkeit:** Pro Plan für Power-User
5. ✅ **Familie/Team:** Mehrere Personen können dasselbe Gerät nutzen

---

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe die Console-Logs in der Desktop-App
2. Prüfe die Server-Logs (`console.log` Ausgaben)
3. Verifiziere die Datenbank-Migration
4. Teste mit den oben genannten Test-Szenarien

---

**Status:** ✅ READY FOR DEPLOYMENT

**Getestet:** Lokal mit Prisma Studio

**Breaking Changes:** Keine (abwärtskompatibel)

**Migration erforderlich:** Ja (siehe Deployment-Sektion)

