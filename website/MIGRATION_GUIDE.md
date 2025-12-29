# Database Migration Guide

## Usage Model hinzufügen

### Schritt 1: Migration erstellen

Die Migration muss manuell ausgeführt werden, da Prisma in AI-gesteuerten Umgebungen aus Sicherheitsgründen blockiert ist.

**Für Development:**

```bash
cd website
npx prisma migrate dev --name add_usage_model
```

Wenn Drift erkannt wird (Datenbank nicht synchron mit Migrationen):

```bash
# WARNUNG: Löscht alle Daten!
npx prisma migrate reset --force --skip-seed

# Dann neue Migration erstellen
npx prisma migrate dev --name add_usage_model
```

**Für Production:**

```bash
cd website
npx prisma migrate deploy
```

### Schritt 2: Prisma Client neu generieren

```bash
npx prisma generate
```

### Schritt 3: Datenbank überprüfen

```bash
npx prisma studio
```

Öffnet ein Browser-Interface zur Überprüfung der Datenbank.

## Was wurde geändert?

### Neues Model: Usage

```prisma
model Usage {
  id         String   @id @default(uuid())
  userId     String
  plan       String   // free, plus, pro
  month      String   // Format: "YYYY-MM"
  labelsUsed Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, month])
  @@index([userId])
  @@index([month])
}
```

### User Model erweitert

```prisma
model User {
  // ... existing fields
  usage Usage[]  // Neue Relation
}
```

## Hinweise

- **Development:** Die SQLite-Datenbank wird in `website/prisma/dev.db` gespeichert
- **Production:** Verwenden Sie eine robustere Datenbank (PostgreSQL empfohlen)
- **Backup:** Erstellen Sie immer ein Backup vor Migrationen in Production!

## Optional: Server-side Usage Tracking

Das Usage Model ist optional. Die Electron-App verwendet lokales Usage Tracking in JSON-Dateien.

Server-side Usage kann für Analytics verwendet werden:

```typescript
// Beispiel: Usage nach Label-Erstellung speichern
await prisma.usage.upsert({
  where: {
    userId_month: {
      userId: user.id,
      month: getCurrentMonth(), // "YYYY-MM"
    },
  },
  update: {
    labelsUsed: {
      increment: count,
    },
  },
  create: {
    userId: user.id,
    plan: user.subscription.plan,
    month: getCurrentMonth(),
    labelsUsed: count,
  },
});
```

## Troubleshooting

### "Drift detected"

Die Datenbank ist nicht synchron mit den Migrationen. Lösung:

```bash
npx prisma migrate reset --force --skip-seed
npx prisma migrate dev --name add_usage_model
```

### "Database locked"

SQLite-Datenbank ist gesperrt. Lösung:

1. Alle Verbindungen schließen
2. Development-Server stoppen
3. Migration erneut versuchen

### Migration schlägt fehl

1. Logs prüfen
2. Schema-Syntax überprüfen
3. Prisma Version prüfen: `npx prisma --version`
4. Bei Bedarf updaten: `npm install prisma@latest @prisma/client@latest`

